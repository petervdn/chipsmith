// Dragging a block with the pointer: its body moves it (to another track too), its edges trim it.
// The press becomes a drag as use-press-drag.ts says (a mouse at once, a finger after holding
// still). Alt drags without the grid. While dragging, the tracks as the drag would leave them are
// given to draw; letting go makes it an edit. Where the block goes is read from the lanes, so it
// follows the timeline when it scrolls during the drag.
import { useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Track } from '../../shared/song.types.ts';
import type { DragMode } from './block-drag.ts';
import { getDraggedTracks } from './block-drag.ts';
import type { GridStep } from './grid.ts';
import type { BlockPlace, Edited } from './song-edits.ts';
import { getLaneTicks } from './lane-position.ts';
import type { PressOrigin } from './use-press-drag.ts';
import { usePressDrag } from './use-press-drag.ts';

/** What a press on a block is on: the block, and whether it moves it or trims it. */
type Pressed = { place: BlockPlace; mode: DragMode; pressTicks: number };

/**
 * Lets blocks be dragged.
 *
 * @param timeline - What a drag needs to know of the timeline.
 * @param timeline.tracks - The draft's tracks.
 * @param timeline.pixelsPerTick - How wide a tick is drawn.
 * @param timeline.rowHeight - How tall a track's row is, in pixels.
 * @param timeline.step - The grid's step.
 * @param timeline.ticksPerBar - The song's ticks to a bar.
 * @param timeline.getClipTicks - Gives how long a clip is, in ticks.
 * @param timeline.onEdit - Called with the tracks a finished drag leaves.
 * @returns `startPress` for a block's pointerdown, the tracks to draw while dragging (null when
 *   not), `redrag` for when the timeline scrolled under the pointer, and `wasDragged`, true just
 *   after a drag so the click it ends with can be ignored.
 */
export function useBlockDrag({
  tracks,
  pixelsPerTick,
  rowHeight,
  step,
  ticksPerBar,
  getClipTicks,
  onEdit,
}: {
  tracks: Track[];
  pixelsPerTick: number;
  rowHeight: number;
  step: GridStep;
  ticksPerBar: number;
  getClipTicks: (place: BlockPlace) => number;
  onEdit: (edited: Edited) => void;
}) {
  const [preview, setPreview] = useState<Edited | null>(null);
  function getEdited(event: PointerEvent, pressed: Pressed, origin: PressOrigin): Edited {
    return getDraggedTracks(
      tracks,
      {
        mode: pressed.mode,
        place: pressed.place,
        ticks:
          (getLaneTicks(event.clientX, pixelsPerTick) ?? pressed.pressTicks) - pressed.pressTicks,
        rows: Math.round((event.clientY - origin.y) / rowHeight),
        isFree: event.altKey,
      },
      { step, ticksPerBar },
      getClipTicks(pressed.place),
    );
  }
  const press = usePressDrag<Pressed>({
    onDrag: (event, pressed, origin) => setPreview(getEdited(event, pressed, origin)),
    onDrop: (event, pressed, origin) => onEdit(getEdited(event, pressed, origin)),
    onEnd: () => setPreview(null),
  });

  /**
   * Starts a press on a block, or on one of its edges.
   *
   * @param event - The pointerdown.
   * @param place - Where the block is.
   * @param mode - Whether the press moves the block or trims it from its start or end.
   */
  function startPress(event: ReactPointerEvent, place: BlockPlace, mode: DragMode): void {
    const pressTicks = getLaneTicks(event.clientX, pixelsPerTick) ?? 0;
    press.startPress(event, { place, mode, pressTicks });
  }
  return { startPress, preview, redrag: press.redrag, wasDragged: press.wasDragged };
}
