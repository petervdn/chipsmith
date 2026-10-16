/**
 * A module from what a song script writes: rows per chip channel for the whole song, instruments,
 * tempo and meter. Cuts the rows into patterns, reuses a pattern a channel repeats, and sets the
 * song's settings as the archive's songs had them (60 Hz, speed 6, a virtual tempo for the bpm).
 */
import type { FurModule, FurSong, Row } from '../fur/fur.types.ts';

/** The chips a song plays on. */
export type ChipSet = 'nes' | 'nes+scc';

/** What a script gives to make a module. */
export type ModuleDraft = {
  title: string;
  comment?: string;
  chips: ChipSet;
  bpm: number;
  beatsPerBar: number;
  /** Rows to a beat; 4 makes a row a 16th note. */
  rowsPerBeat?: number;
  /** Rows to a pattern. */
  patternLength?: number;
  /**
   * One list of rows per chip channel, all as long as the song: NES pulse 1, pulse 2, triangle,
   * noise, DPCM, then for the SCC+ its five channels. `null` is an empty row.
   */
  channels: (Row | null)[][];
  instruments: Uint8Array[];
  wavetables?: Uint8Array[];
  /** Each chip's volume, NES first. */
  chipVolumes?: number[];
};

const TICK_RATE = 60;
const SPEED = 6;
/** The denominator of the virtual tempo; its numerator sets the bpm. */
const TEMPO_BASE = 150;
const NES = 0x06;
const SCC_PLUS = 0xb4;
const CHANNELS_OF_CHIP = 5;
const NES_FLAGS = 'clockSel=0\ncustomClock=0\ndpcmMode=false\n';

/** The module of a draft. */
export function buildModule({
  title,
  comment = '',
  chips,
  bpm,
  beatsPerBar,
  rowsPerBeat = 4,
  patternLength = 64,
  channels,
  instruments,
  wavetables = [],
  chipVolumes,
}: ModuleDraft): FurModule {
  const chipIds = chips === 'nes' ? [NES] : [NES, SCC_PLUS];
  const channelCount = chipIds.length * CHANNELS_OF_CHIP;
  if (channels.length !== channelCount) {
    throw new Error(`${chips} has ${channelCount} channels; the draft has ${channels.length}`);
  }
  const length = Math.max(...channels.map((rows) => rows.length));
  const orderCount = Math.ceil(length / patternLength);
  const patterns: FurModule['patterns'] = [];
  const orders = channels.map((rows, channel) => {
    const indexByContent = new Map<string, number>();
    return Array.from({ length: orderCount }, (_slot, order) => {
      const chunk = Array.from(
        { length: patternLength },
        (_row, i) => rows[order * patternLength + i] ?? null,
      );
      const content = JSON.stringify(chunk);
      let index = indexByContent.get(content);
      if (index === undefined) {
        index = indexByContent.size;
        indexByContent.set(content, index);
        patterns.push({ channel, index, rows: chunk });
      }
      return index;
    });
  });
  const baseBpm = (TICK_RATE * 60) / (SPEED * rowsPerBeat);
  const song: FurSong = {
    name: title,
    author: '',
    systemName: chips === 'nes' ? 'NES' : 'NES + SCC+',
    comment,
    chips: chipIds,
    chipVolumes: chipVolumes ?? chipIds.map(() => 1),
    chipFlags: chipIds.map((chip) => (chip === NES ? NES_FLAGS : null)),
    channelCount,
    tickRate: TICK_RATE,
    speeds: [SPEED],
    virtualTempo: { numerator: Math.round((bpm / baseBpm) * TEMPO_BASE), denominator: TEMPO_BASE },
    patternLength,
    highlights: { first: rowsPerBeat, second: rowsPerBeat * beatsPerBar },
    orders,
    effectColumns: channels.map((rows) =>
      Math.max(1, ...rows.map((row) => row?.effects?.length ?? 0)),
    ),
  };
  return { song, instruments, wavetables, patterns };
}
