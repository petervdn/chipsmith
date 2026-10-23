/**
 * Taking a stretch of time out of a song's arrangement: every block over it cut there, its part
 * before kept and its part after moved up to close the gap, and every block after it moved up too.
 * A block's repeats are kept as repeats where whole, and the repeat the cut falls in becomes a
 * trimmed block. No clip changes: the cut is in the blocks only. Knows nothing of the page.
 */
import type { Block, Track } from '../../shared/song.schema.ts';

/** A stretch of the song, in ticks from its start: from `from` up to `to`. */
export type TickRange = { from: number; to: number };

/**
 * Returns the tracks with a stretch of time taken out.
 *
 * @param tracks - The song's tracks.
 * @param range - The stretch taken out, in ticks.
 * @param getClipTicks - Returns how long a clip is, in ticks, from its id.
 * @returns The tracks with the stretch taken out, each track's blocks in order of their start.
 */
export function removeTicks(
  tracks: Track[],
  range: TickRange,
  getClipTicks: (clipId: string) => number,
): Track[] {
  if (range.to <= range.from) return tracks;
  return tracks.map((track) => ({
    ...track,
    blocks: track.blocks
      .flatMap((block) => cutBlock(block, range, getClipTicks(block.clip)))
      .sort((first, second) => first.start - second.start),
  }));
}

/**
 * Returns what is left of a block once a stretch of time is taken out, moved to close the gap.
 *
 * @param block - The block.
 * @param range - The stretch taken out, in ticks.
 * @param range.from - Where it starts.
 * @param range.to - Where it ends.
 * @param clipTicks - How long the block's clip is, in ticks.
 * @returns The block's pieces: none, one, or up to four.
 */
function cutBlock(block: Block, { from, to }: TickRange, clipTicks: number): Block[] {
  const length = block.trim?.length ?? clipTicks;
  const offset = block.trim?.offset ?? 0;
  const end = block.start + length * block.repeats;
  const cut = to - from;
  if (end <= from) return [block];
  if (block.start >= to) return [{ ...block, start: block.start - cut }];
  const pieces: Block[] = [];
  if (block.start < from) {
    const wholeBefore = Math.floor((from - block.start) / length);
    if (wholeBefore > 0) pieces.push({ ...block, repeats: wholeBefore });
    const partStart = block.start + wholeBefore * length;
    if (from > partStart) {
      pieces.push({
        clip: block.clip,
        start: partStart,
        trim: { offset, length: from - partStart },
        repeats: 1,
      });
    }
  }
  if (end > to) {
    const inRepeat = Math.floor((to - block.start) / length);
    const repeatStart = block.start + inRepeat * length;
    const into = to - repeatStart;
    if (into > 0) {
      pieces.push({
        clip: block.clip,
        start: from,
        trim: { offset: offset + into, length: length - into },
        repeats: 1,
      });
    }
    const next = into > 0 ? inRepeat + 1 : inRepeat;
    if (block.repeats > next) {
      pieces.push({
        ...block,
        start: block.start + next * length - cut,
        repeats: block.repeats - next,
      });
    }
  }
  return pieces;
}
