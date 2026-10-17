/**
 * Cutting a .fur file by channel: which channels play notes, and a channel's own .fur file, the
 * whole song with every other channel's notes taken out (their effects kept, as speed, tempo and
 * jumps act on the whole song from whichever channel holds them). Knows nothing of clips or songs.
 */
import type { FurFile, FurSong, Row } from './fur.types.ts';

/** The chip ids whose channels have names here, and the names of their five channels. */
const CHANNEL_NAMES: Record<number, string[]> = {
  6: ['Pulse 1', 'Pulse 2', 'Triangle', 'Noise', 'DPCM'],
  0xa1: ['SCC 1', 'SCC 2', 'SCC 3', 'SCC 4', 'SCC 5'],
  0xb4: ['SCC 1', 'SCC 2', 'SCC 3', 'SCC 4', 'SCC 5'],
};
/** The channels of a chip this project writes. */
const CHANNELS_OF_CHIP = 5;

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
 * Returns the channels that play a note anywhere in the song.
 *
 * @param furFile - The .fur file.
 * @returns The channels' numbers, in order.
 */
export function getPlayingChannels(furFile: FurFile): number[] {
  const playing = new Set(
    furFile.patterns
      .filter((pattern) => pattern.rows.some((row) => row?.note !== undefined))
      .map((pattern) => pattern.channel),
  );
  return [...playing].sort((first, second) => first - second);
}

/**
 * Makes the .fur file of one channel: the whole song, every other channel's notes, instruments and
 * volumes taken out and its effects kept.
 *
 * @param furFile - The .fur file.
 * @param channel - The channel kept.
 * @returns The channel's .fur file.
 */
export function getChannelFurFile(furFile: FurFile, channel: number): FurFile {
  return {
    ...furFile,
    patterns: furFile.patterns.map((pattern) =>
      pattern.channel === channel
        ? pattern
        : { ...pattern, rows: pattern.rows.map(withEffectsOnly) },
    ),
  };
}

/**
 * Returns a row with only its effects.
 *
 * @param row - The row, or null for an empty one.
 * @returns The row's effects alone, or null when it has none.
 */
function withEffectsOnly(row: Row | null): Row | null {
  return row?.effects && row.effects.length > 0 ? { effects: row.effects } : null;
}
