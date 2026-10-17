/**
 * Cutting a .fur file by channel: which channels play notes, and a channel's own .fur file, the
 * whole song with every other channel's notes taken out (their effects kept, as speed, tempo and
 * jumps act on the whole song from whichever channel holds them). Knows nothing of clips or songs.
 */
import type { FurFile, Row } from './fur.types.ts';

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
