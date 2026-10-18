/**
 * Where a dragged block goes: moved by the pointer (snapped to the grid, onto the track it is
 * dragged to), or one of its edges dragged to trim it, within its clip and never shorter than a
 * step of the grid; and where a clip dragged onto a track goes, as a new block snapped the same way.
 * Given the drag, gives the edited tracks; knows nothing of the page.
 */
import type { Track } from '../../shared/song.schema.ts';
import type { GridStep } from './grid.ts';
import { getStepTicks, snapToGrid } from './grid.ts';
import type { BlockPlace, Edited } from './song-edits.ts';
import { addBlock, getBlock, moveBlock, trimBlock } from './song-edits.ts';

/** What a drag does: move the block, or trim it from its start or its end. */
export type DragMode = 'move' | 'trim-start' | 'trim-end';

/** A drag so far: what it does to which block, and how far the pointer went. */
export type Drag = {
  mode: DragMode;
  place: BlockPlace;
  /** How far the pointer went sideways, in ticks. */
  ticks: number;
  /** How many track rows the pointer went down (up is negative). */
  rows: number;
  /** Whether the block goes where the pointer is, without the grid. */
  isFree: boolean;
};

/**
 * Returns the tracks as a drag leaves them.
 *
 * @param tracks - The song's tracks before the drag.
 * @param drag - The drag so far.
 * @param grid - What the drag snaps to.
 * @param grid.step - The grid's step.
 * @param grid.ticksPerBar - The song's ticks to a bar.
 * @param clipTicks - How long the dragged block's clip is, in ticks.
 * @returns The tracks with the block moved or trimmed, and where it is now.
 */
export function getDraggedTracks(
  tracks: Track[],
  drag: Drag,
  { step, ticksPerBar }: { step: GridStep; ticksPerBar: number },
  clipTicks: number,
): Edited {
  const block = getBlock(tracks, drag.place);
  if (!block) return { tracks, place: drag.place };
  function snap(ticks: number): number {
    return drag.isFree ? Math.round(ticks) : snapToGrid(ticks, step, ticksPerBar);
  }
  const least = drag.isFree ? 1 : getStepTicks(step, ticksPerBar);
  const offset = block.trim ? block.trim.offset : 0;
  const length = block.trim ? block.trim.length : clipTicks;
  if (drag.mode === 'move') {
    const trackIndex = tracks.findIndex((track) => track.id === drag.place.trackId);
    const target = tracks[Math.min(tracks.length - 1, Math.max(0, trackIndex + drag.rows))];
    return moveBlock(tracks, drag.place, {
      start: snap(block.start + drag.ticks),
      trackId: target?.id ?? drag.place.trackId,
    });
  }
  if (drag.mode === 'trim-end') {
    const end = snap(block.start + length + drag.ticks);
    const kept = Math.min(clipTicks - offset, Math.max(least, end - block.start));
    return trimBlock(
      tracks,
      drag.place,
      { start: block.start, trim: { offset, length: kept } },
      clipTicks,
    );
  }
  const lowest = Math.max(block.start - offset, 0);
  const start = Math.min(
    block.start + length - least,
    Math.max(lowest, snap(block.start + drag.ticks)),
  );
  const moved = start - block.start;
  return trimBlock(
    tracks,
    drag.place,
    { start, trim: { offset: offset + moved, length: length - moved } },
    clipTicks,
  );
}

/** A clip dragged onto a track: which clip, the track, and the tick the pointer is at. */
export type ClipDrop = {
  clipId: string;
  trackId: string;
  /** Where on the track the pointer is, in ticks from the song's start. */
  ticks: number;
  /** Whether the block goes where the pointer is, without the grid. */
  isFree: boolean;
};

/**
 * Returns the tracks with a clip dropped on one: a new block of it starting where the pointer is,
 * snapped to the grid.
 *
 * @param tracks - The song's tracks.
 * @param drop - The clip, the track and where on it.
 * @param grid - What the drop snaps to.
 * @param grid.step - The grid's step.
 * @param grid.ticksPerBar - The song's ticks to a bar.
 * @returns The tracks with the block added, and where it is.
 */
export function getDroppedTracks(
  tracks: Track[],
  drop: ClipDrop,
  { step, ticksPerBar }: { step: GridStep; ticksPerBar: number },
): Edited {
  const start = drop.isFree ? Math.round(drop.ticks) : snapToGrid(drop.ticks, step, ticksPerBar);
  return addBlock(tracks, { clipId: drop.clipId, start, trackId: drop.trackId });
}
