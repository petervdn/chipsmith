/**
 * A .fur file from what a song script writes: rows per chip channel for the whole song, instruments,
 * tempo and meter. Cuts the rows into patterns, reuses a pattern a channel repeats, and sets the
 * song's settings as the archive's songs had them (60 Hz, speed 6, a virtual tempo for the bpm).
 */
import type { ChipName } from '../shared/chips.ts';
import { CHIP_NAMES, CHIPS, getFurnaceChip } from '../shared/chips.ts';
import type { FurFile, FurSong, Row } from '../fur/fur.types.ts';

/** What a script gives to make a .fur file. */
export type FurFileDraft = {
  title: string;
  comment?: string;
  /** The chips, each once; their channels come in the order of CHIP_NAMES (NES first). */
  chips: ChipName[];
  bpm: number;
  beatsPerBar: number;
  /** Rows to a beat; 4 makes a row a 16th note. */
  rowsPerBeat?: number;
  /** Rows to a pattern. */
  patternLength?: number;
  /**
   * One list of rows per chip channel, all as long as the song, chip by chip in the order of
   * CHIP_NAMES (NES: pulse 1, pulse 2, triangle, noise, DPCM; SCC+: 5; SID: 3). `null` is an
   * empty row.
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
/**
 * The flags each chip is written with: the NES and the SID as the demos have them (the SID's clock
 * PAL, as the European C64 most of its music was written for), the SCC+ with none.
 */
const CHIP_FLAGS = {
  nes: 'clockSel=0\ncustomClock=0\ndpcmMode=false\n',
  scc: null,
  sid: 'clockSel=1\n',
} satisfies Record<ChipName, string | null>;

/**
 * Builds the .fur file of a draft: cuts each channel's rows into patterns, reusing a pattern the
 * channel repeats, and sets the song's settings.
 *
 * @param draft - What the script wrote for the song.
 * @param draft.title - The song's name.
 * @param draft.comment - The song's comment; empty if left out.
 * @param draft.chips - The chips the song plays on, each once, in any order.
 * @param draft.bpm - The song's tempo, in beats a minute.
 * @param draft.beatsPerBar - Beats to a bar.
 * @param draft.rowsPerBeat - Rows to a beat; 4 if left out, which makes a row a 16th note.
 * @param draft.patternLength - Rows to a pattern; 64 if left out.
 * @param draft.channels - One list of rows per chip channel; there must be as many as the chips have.
 * @param draft.instruments - The instruments, as Furnace's bytes.
 * @param draft.wavetables - The wavetables, as Furnace's bytes; none if left out.
 * @param draft.chipVolumes - Each chip's volume, in the order of CHIP_NAMES; 1 for each if left out.
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
  const furnaceChips = CHIP_NAMES.filter((name) => chips.includes(name)).map((name) => {
    const chip = getFurnaceChip(CHIPS[name].furnaceId);
    if (!chip) throw new Error(`no Furnace chip for ${name}`);
    return { ...chip, flags: CHIP_FLAGS[name] };
  });
  if (furnaceChips.length === 0) throw new Error('a song needs at least one chip');
  const channelCount = furnaceChips.reduce((sum, chip) => sum + chip.channelNames.length, 0);
  if (channels.length !== channelCount) {
    const names = furnaceChips.map((chip) => chip.name).join(' + ');
    throw new Error(`${names} has ${channelCount} channels; the draft has ${channels.length}`);
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
    systemName: furnaceChips.map((chip) => chip.name).join(' + '),
    comment,
    chips: furnaceChips.map((chip) => chip.id),
    chipVolumes: chipVolumes ?? furnaceChips.map(() => 1),
    chipFlags: furnaceChips.map((chip) => chip.flags),
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
