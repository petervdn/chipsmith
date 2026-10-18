// Dragging a clip from the song's clips onto the timeline: the press becomes a drag as
// use-press-drag.ts says, a copy of the clip's row follows the pointer, held where it was grabbed,
// and over a track's lane the new block is drawn where it would go (snapped; Alt without the grid).
// Letting go over a lane makes it an edit; anywhere else, nothing.
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Track } from '../../shared/song.schema.ts';
import { getDroppedTracks } from './block-drag.ts';
import type { GridStep } from './grid.ts';
import type { Edited } from './song-edits.ts';
import { getLaneAt } from './lane-position.ts';
import { usePressDrag } from './use-press-drag.ts';

/** Where a clip's row was grabbed, from its top left, and how wide it is, in pixels. */
export type ClipGrab = { x: number; y: number; width: number };

/**
 * A clip being dragged: which, where the pointer is, where its row was grabbed, and the tracks a
 * drop there would leave.
 */
export type ClipDrag = {
  clipId: string;
  x: number;
  y: number;
  grab: ClipGrab;
  preview: Edited | null;
};

/**
 * Lets the song's clips be dragged onto the timeline.
 *
 * @param timeline - What a drop needs to know of the timeline.
 * @param timeline.tracks - The draft's tracks.
 * @param timeline.pixelsPerTick - How wide a tick is drawn.
 * @param timeline.step - The grid's step.
 * @param timeline.ticksPerBar - The song's ticks to a bar.
 * @param timeline.onEdit - Called with the tracks a drop leaves.
 * @returns `startPress` for a clip's pointerdown, with the clip's id; the drag going on (null
 *   when none); `redrag` for when the timeline scrolled under the pointer; and `wasDragged`, true
 *   just after a drag so the click it ends with can be ignored.
 */
export function useClipDrag({
  tracks,
  pixelsPerTick,
  step,
  ticksPerBar,
  onEdit,
}: {
  tracks: Track[];
  pixelsPerTick: number;
  step: GridStep;
  ticksPerBar: number;
  onEdit: (edited: Edited) => void;
}) {
  const [drag, setDrag] = useState<ClipDrag | null>(null);
  const grabRef = useRef<ClipGrab>({ x: 0, y: 0, width: 0 });
  function getDropped(event: PointerEvent, clipId: string): Edited | null {
    const lane = getLaneAt(event.clientX, event.clientY);
    if (!lane) return null;
    const ticks = (event.clientX - lane.left) / pixelsPerTick;
    return getDroppedTracks(
      tracks,
      { clipId, trackId: lane.trackId, ticks, isFree: event.altKey },
      { step, ticksPerBar },
    );
  }
  const press = usePressDrag<string>({
    onDrag: (event, clipId) =>
      setDrag({
        clipId,
        x: event.clientX,
        y: event.clientY,
        grab: grabRef.current,
        preview: getDropped(event, clipId),
      }),
    onDrop: (event, clipId) => {
      const dropped = getDropped(event, clipId);
      if (dropped) onEdit(dropped);
    },
    onEnd: () => setDrag(null),
  });
  /**
   * Starts a press on a clip's row, keeping where on the row it was grabbed.
   *
   * @param event - The pointerdown on the row.
   * @param clipId - The clip pressed.
   */
  function startPress(event: ReactPointerEvent<HTMLElement>, clipId: string): void {
    const box = event.currentTarget.getBoundingClientRect();
    grabRef.current = { x: event.clientX - box.left, y: event.clientY - box.top, width: box.width };
    press.startPress(event, clipId);
  }
  return { startPress, drag, redrag: press.redrag, wasDragged: press.wasDragged };
}
