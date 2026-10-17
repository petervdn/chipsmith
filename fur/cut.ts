/**
 * Cutting a .fur file along its channels and its order rows: which channel plays which pattern at
 * each order row, a piece for every pattern that has notes (one channel, one order row), and the
 * piece's own .fur file. A pattern a channel plays again is the same piece. Knows nothing of clips
 * or songs.
 */
import type { FurFile, FurSong, Pattern, Row } from './fur.types.ts';

/** The chip ids whose channels have names here, and the names of their five channels. */
const CHANNEL_NAMES: Record<number, string[]> = {
  6: ['Pulse 1', 'Pulse 2', 'Triangle', 'Noise', 'DPCM'],
  0xa1: ['SCC 1', 'SCC 2', 'SCC 3', 'SCC 4', 'SCC 5'],
  0xb4: ['SCC 1', 'SCC 2', 'SCC 3', 'SCC 4', 'SCC 5'],
};
/** The channels of a chip this project writes. */
const CHANNELS_OF_CHIP = 5;
/** Effects that jump or stop the song; a piece plays straight through its rows, so they go. */
const JUMP_EFFECTS = new Set([0x0b, 0x0d, 0xff]);

/** One channel's pattern, cut out to be a piece of its own. */
export type Piece = {
  channel: number;
  /** The pattern's index among the channel's patterns. */
  patternIndex: number;
  /** The section it is first heard in: a letter per different order row, A first. */
  section: string;
  /** The order row it is first heard at. */
  firstOrder: number;
};

/** How a .fur file is cut: its pieces, and per channel that plays, which piece each order plays. */
export type Cut = {
  pieces: Piece[];
  channels: { channel: number; name: string; orders: (number | null)[] }[];
};

/**
 * Returns the names of a song's channels, chip by chip.
 *
 * @param song - The song's settings.
 * @returns A name per channel ("Pulse 1", "Triangle", "SCC 2"; "Channel 7" for a chip not known).
 */
export function getChannelNames(song: FurSong): string[] {
  const names = song.chips.flatMap(
    (chip, chipIndex) =>
      CHANNEL_NAMES[chip] ??
      Array.from(
        { length: CHANNELS_OF_CHIP },
        (_unused, i) => `Channel ${chipIndex * CHANNELS_OF_CHIP + i + 1}`,
      ),
  );
  return Array.from({ length: song.channelCount }, (_unused, i) => names[i] ?? `Channel ${i + 1}`);
}

/**
 * Returns how long a row plays.
 *
 * @param song - The song's settings: its tick rate, speeds and virtual tempo.
 * @returns The seconds of a row; with a groove, the average over its speeds.
 */
export function getSecondsPerRow(song: FurSong): number {
  const speed = song.speeds.reduce((sum, value) => sum + value, 0) / (song.speeds.length || 1);
  const { numerator, denominator } = song.virtualTempo;
  return (speed / song.tickRate) * (denominator / numerator);
}

/**
 * Works out how a .fur file is cut: a piece per pattern with notes, sections lettered by the order
 * rows that differ, and per channel with notes, the piece each order row plays (null for none).
 *
 * @param furFile - The .fur file to cut.
 * @returns The pieces and the channels' order rows.
 */
export function getCut(furFile: FurFile): Cut {
  const { song } = furFile;
  const orderCount = song.orders[0]?.length ?? 0;
  const sections = getSectionLetters(song.orders, orderCount);
  const names = getChannelNames(song);
  const pieces: Piece[] = [];
  const channels: Cut['channels'] = [];
  for (let channel = 0; channel < song.channelCount; channel++) {
    const orders = song.orders[channel] ?? [];
    const pieceOf = new Map<number, number>();
    const played = Array.from({ length: orderCount }, (_unused, order): number | null => {
      const patternIndex = orders[order];
      const pattern = findPattern(furFile, channel, patternIndex);
      if (patternIndex === undefined || !pattern || !hasNotes(pattern)) return null;
      const known = pieceOf.get(patternIndex);
      if (known !== undefined) return known;
      pieces.push({ channel, patternIndex, section: sections[order] ?? 'A', firstOrder: order });
      pieceOf.set(patternIndex, pieces.length - 1);
      return pieces.length - 1;
    });
    if (played.some((piece) => piece !== null)) {
      channels.push({ channel, name: names[channel] ?? `Channel ${channel + 1}`, orders: played });
    }
  }
  return { pieces, channels };
}

/**
 * Makes the .fur file of a piece: the song's settings, instruments and wavetables, one order row,
 * the piece's pattern on its channel (without effects that jump or stop) and the others empty.
 *
 * @param furFile - The .fur file the piece is cut from.
 * @param piece - The piece.
 * @returns The piece's .fur file.
 */
export function getPieceFurFile(furFile: FurFile, piece: Piece): FurFile {
  const { song } = furFile;
  const pattern = findPattern(furFile, piece.channel, piece.patternIndex);
  const empty = Array.from({ length: song.patternLength }, (): Row | null => null);
  const patterns: Pattern[] = Array.from({ length: song.channelCount }, (_unused, channel) => ({
    channel,
    index: 0,
    rows: channel === piece.channel && pattern ? pattern.rows.map(withoutJumps) : empty,
  }));
  return {
    ...furFile,
    song: { ...song, orders: song.orders.map(() => [0]) },
    patterns,
  };
}

/**
 * Returns a letter per order row: A for the first, the next letter for each order row that differs
 * from every one before it, and the earlier letter for one that repeats.
 *
 * @param orders - For each channel, the pattern index at each order.
 * @param orderCount - How many order rows there are.
 * @returns The letters, one per order row.
 */
function getSectionLetters(orders: number[][], orderCount: number): string[] {
  const seen = new Map<string, string>();
  return Array.from({ length: orderCount }, (_unused, order) => {
    const key = orders.map((channel) => channel[order]).join(',');
    const letter = seen.get(key) ?? String.fromCharCode(65 + (seen.size % 26));
    seen.set(key, letter);
    return letter;
  });
}

/**
 * Finds a channel's pattern by its index.
 *
 * @param furFile - The .fur file.
 * @param channel - The channel.
 * @param patternIndex - The pattern's index, or undefined.
 * @returns The pattern, or undefined when the file has none there.
 */
function findPattern(
  furFile: FurFile,
  channel: number,
  patternIndex: number | undefined,
): Pattern | undefined {
  return furFile.patterns.find(
    (pattern) => pattern.channel === channel && pattern.index === patternIndex,
  );
}

/**
 * Tells whether a pattern plays a note.
 *
 * @param pattern - The pattern.
 * @returns Whether any of its rows has a note.
 */
function hasNotes(pattern: Pattern): boolean {
  return pattern.rows.some((row) => row?.note !== undefined);
}

/**
 * Returns a row without the effects that jump or stop the song.
 *
 * @param row - The row, or null for an empty one.
 * @returns The row without them, or null.
 */
function withoutJumps(row: Row | null): Row | null {
  if (!row?.effects) return row;
  return {
    ...row,
    effects: row.effects.filter((effect) => effect.code === null || !JUMP_EFFECTS.has(effect.code)),
  };
}
