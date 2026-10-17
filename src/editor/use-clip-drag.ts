// Dragging a clip from the song's clips onto the timeline: the press becomes a drag as
// use-press-drag.ts says, a chip of the clip follows the pointer, and over a track's lane the new
// block is drawn where it would go (snapped; Alt without the grid). Letting go over a lane makes it
// an edit; anywhere else, nothing.
import { useState } from 'react';
import type { Track } from '../../shared/song.types.ts';
import { getDroppedTracks } from './block-drag.ts';
import type { GridStep } from './grid.ts';
import type { Edited } from './song-edits.ts';
import { usePressDrag } from './use-press-drag.ts';

/** The attribute on a track's lane that names its track, where a clip can be dropped. */
export const LANE_TRACK_ATTRIBUTE = 'data-track-id';

/** A clip being dragged: which, where the pointer is, and the tracks a drop there would leave. */
export type ClipDrag = { clipId: string; x: number; y: number; preview: Edited | null };

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
 *   when none); and `wasDragged`, true just after a drag so the click it ends with can be ignored.
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
  function getDropped(event: PointerEvent, clipId: string): Edited | null {
    const lane = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest(`[${LANE_TRACK_ATTRIBUTE}]`);
    const trackId = lane?.getAttribute(LANE_TRACK_ATTRIBUTE);
    if (!lane || !trackId) return null;
    const ticks = (event.clientX - lane.getBoundingClientRect().left) / pixelsPerTick;
    return getDroppedTracks(
      tracks,
      { clipId, trackId, ticks, isFree: event.altKey },
      { step, ticksPerBar },
    );
  }
  const press = usePressDrag<string>({
    onDrag: (event, clipId) =>
      setDrag({ clipId, x: event.clientX, y: event.clientY, preview: getDropped(event, clipId) }),
    onDrop: (event, clipId) => {
      const dropped = getDropped(event, clipId);
      if (dropped) onEdit(dropped);
    },
    onEnd: () => setDrag(null),
  });
  return { startPress: press.startPress, drag, wasDragged: press.wasDragged };
}
