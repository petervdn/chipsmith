/** How long a song is: where its last block, with its trim and repeats, ends. Given numbers, gives numbers. */
import type { Block, Song } from './song.schema.ts';
import { TICKS_PER_BEAT } from './ticks.ts';

/**
 * Returns the number of ticks to a second at a tempo.
 *
 * @param bpm - The tempo, in beats a minute.
 * @returns The ticks in a second.
 */
export function getTicksPerSecond(bpm: number): number {
  return (bpm / 60) * TICKS_PER_BEAT;
}

/**
 * Returns the tick at which a block's last repeat ends.
 *
 * @param block - The block, with its start, trim and repeats.
 * @param block.start - Where the block starts, in ticks from the song's start.
 * @param block.trim - The part of the clip it plays, or null for all of it.
 * @param block.repeats - How many times it plays, back to back.
 * @param clipSeconds - The length of the block's clip, in seconds.
 * @param bpm - The song's tempo.
 * @returns Where the last repeat ends, in ticks from the song's start.
 */
export function getBlockEnd(
  { start, trim, repeats }: Block,
  clipSeconds: number,
  bpm: number,
): number {
  const length = trim ? trim.length : Math.round(clipSeconds * getTicksPerSecond(bpm));
  return start + length * repeats;
}

/**
 * Returns a song's length in seconds: where its last block ends.
 *
 * @param song - The song.
 * @param getClipSeconds - Gives a clip's length in seconds by its id; for a clip that is not known
 *   it gives 0, so that its block counts as empty.
 * @returns The song's length, in seconds.
 */
export function getSongSeconds(song: Song, getClipSeconds: (clipId: string) => number): number {
  let end = 0;
  for (const track of song.tracks) {
    for (const block of track.blocks) {
      end = Math.max(end, getBlockEnd(block, getClipSeconds(block.clip), song.bpm));
    }
  }
  return end / getTicksPerSecond(song.bpm);
}
