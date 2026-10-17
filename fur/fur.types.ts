/**
 * What a .fur file is made of, as this project writes them (format version 223, Furnace 0.6.8's,
 * old INFO layout, one subsong): the song's settings, its instruments and wavetables as finished
 * blocks, and its patterns as rows.
 */

/** An effect in a row: its code and its value, either of which may be left out. */
export type Effect = { code: number | null; value: number | null };

/** A row of a pattern that has something in it. A field left out is empty in the tracker. */
export type Row = { note?: number; instrument?: number; volume?: number; effects?: Effect[] };

/** One channel's pattern at an index, its rows `null` where empty. */
export type Pattern = { channel: number; index: number; rows: (Row | null)[] };

/** The song's settings, as the INFO block holds them. */
export type FurSong = {
  name: string;
  author: string;
  /** The name of the system, as Furnace shows it ("NES", "NES + Konami SCC+"). */
  systemName: string;
  comment: string;
  /** Furnace's chip ids, in order (0x06 NES, 0xB4 SCC+, 0xA1 SCC). */
  chips: number[];
  /** Each chip's volume. */
  chipVolumes: number[];
  /** Each chip's flags text, or null for a chip without a FLAG block. */
  chipFlags: (string | null)[];
  channelCount: number;
  /** Ticks per second. */
  tickRate: number;
  /** The speeds, ticks to a row; one, or several for a groove. */
  speeds: number[];
  /** The virtual tempo: the tempo is multiplied by numerator / denominator. */
  virtualTempo: { numerator: number; denominator: number };
  patternLength: number;
  /** The rows the tracker highlights. */
  highlights: { first: number; second: number };
  /** For each channel, the pattern index at each order. */
  orders: number[][];
  /** For each channel, how many effect columns it shows. */
  effectColumns: number[];
  /** For each channel, the name the song gives it ("Bass"), or an empty string for none. */
  channelNames: string[];
};

/** A whole .fur file: the song, its instrument and wavetable blocks, and its patterns. */
export type FurFile = {
  song: FurSong;
  instruments: Uint8Array[];
  wavetables: Uint8Array[];
  patterns: Pattern[];
};
