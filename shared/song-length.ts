/** How long a song is: where its last block, with its trim and repeats, ends. Given numbers, gives numbers. */
import type { Block, Song } from './song.types.ts';
import { TICKS_PER_BEAT } from './song.types.ts';

/** Ticks to a second at a tempo. */
export function getTicksPerSecond(bpm: number): number {
  return (bpm / 60) * TICKS_PER_BEAT;
}

/** Where a block's last repeat ends, in ticks; `clipSeconds` is how long its clip is. */
export function getBlockEnd(
  { start, trim, repeats }: Block,
  clipSeconds: number,
  bpm: number,
): number {
  const length = trim ? trim.length : Math.round(clipSeconds * getTicksPerSecond(bpm));
  return start + length * repeats;
}

/** The song's length in seconds; a block whose clip is not known counts as empty. */
export function getSongSeconds(song: Song, getClipSeconds: (clipId: string) => number): number {
  let end = 0;
  for (const track of song.tracks) {
    for (const block of track.blocks) {
      end = Math.max(end, getBlockEnd(block, getClipSeconds(block.clip), song.bpm));
    }
  }
  return end / getTicksPerSecond(song.bpm);
}
