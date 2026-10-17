/**
 * A .fur file from what a song script writes: rows per chip channel for the whole song, instruments,
 * tempo and meter. Cuts the rows into patterns, reuses a pattern a channel repeats, and sets the
 * song's settings as the archive's songs had them (60 Hz, speed 6, a virtual tempo for the bpm).
 */
import type { FurFile, FurSong, Row } from '../fur/fur.types.ts';

/** The chips a song plays on. */
export type ChipSet = 'nes' | 'nes+scc';

/** What a script gives to make a .fur file. */
export type FurFileDraft = {
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

/**
 * Builds the .fur file of a draft: cuts each channel's rows into patterns, reusing a pattern the
 * channel repeats, and sets the song's settings.
 *
 * @param draft - What the script wrote for the song.
 * @param draft.title - The song's name.
 * @param draft.comment - The song's comment; empty if left out.
 * @param draft.chips - The chips the song plays on.
 * @param draft.bpm - The song's tempo, in beats a minute.
 * @param draft.beatsPerBar - Beats to a bar.
 * @param draft.rowsPerBeat - Rows to a beat; 4 if left out, which makes a row a 16th note.
 * @param draft.patternLength - Rows to a pattern; 64 if left out.
 * @param draft.channels - One list of rows per chip channel; there must be as many as the chips have.
 * @param draft.instruments - The instruments, as Furnace's bytes.
 * @param draft.wavetables - The wavetables, as Furnace's bytes; none if left out.
 * @param draft.chipVolumes - Each chip's volume, NES first; 1 for each if left out.
 * @returns The .fur file.
 */
export function buildFurFile({
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
}: FurFileDraft): FurFile {
  const chipIds = chips === 'nes' ? [NES] : [NES, SCC_PLUS];
  const channelCount = chipIds.length * CHANNELS_OF_CHIP;
  if (channels.length !== channelCount) {
    throw new Error(`${chips} has ${channelCount} channels; the draft has ${channels.length}`);
  }
  const length = Math.max(...channels.map((rows) => rows.length));
  const orderCount = Math.ceil(length / patternLength);
  const patterns: FurFile['patterns'] = [];
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
