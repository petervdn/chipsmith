// Dragging a block with the pointer: its body moves it (to another track too), its edges trim it.
// A mouse drag starts after a few pixels; on a touch screen a block is held still for a moment
// first, so a swipe still scrolls the timeline. Alt drags without the grid. While dragging, the
// tracks as the drag would leave them are given to draw; letting go makes it an edit.
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Track } from '../../shared/song.types.ts';
import type { DragMode } from './block-drag.ts';
import { getDraggedTracks } from './block-drag.ts';
import type { GridStep } from './grid.ts';
import type { BlockPlace, Edited } from './song-edits.ts';

/** Pixels a mouse moves before a press becomes a drag. */
const MOUSE_SLOP = 4;
/** Milliseconds a finger holds a block before it can be dragged. */
const HOLD_TIME = 350;
/** Pixels a finger may move while holding; more is a swipe, which scrolls. */
const TOUCH_SLOP = 8;

/** A press on a block, before and while it is a drag. */
type Press = {
  mode: DragMode;
  place: BlockPlace;
  x: number;
  y: number;
  isTouch: boolean;
  isDragging: boolean;
};

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
 *   not), and `wasDragged`, true just after a drag so the click it ends with can be ignored.
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
  const pressRef = useRef<Press | null>(null);
  const draggedRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({
    tracks,
    pixelsPerTick,
    rowHeight,
    step,
    ticksPerBar,
    getClipTicks,
    onEdit,
  });
  useEffect(() => {
    latest.current = { tracks, pixelsPerTick, rowHeight, step, ticksPerBar, getClipTicks, onEdit };
  });

  useEffect(() => {
    function getEdited(event: PointerEvent, press: Press): Edited {
      const now = latest.current;
      return getDraggedTracks(
        now.tracks,
        {
          mode: press.mode,
          place: press.place,
          ticks: (event.clientX - press.x) / now.pixelsPerTick,
          rows: Math.round((event.clientY - press.y) / now.rowHeight),
          isFree: event.altKey,
        },
        { step: now.step, ticksPerBar: now.ticksPerBar },
        now.getClipTicks(press.place),
      );
    }
    function onMove(event: PointerEvent): void {
      const press = pressRef.current;
      if (!press) return;
      const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      if (!press.isDragging) {
        if (press.isTouch) {
          if (distance > TOUCH_SLOP) end();
          return;
        }
        if (distance < MOUSE_SLOP) return;
        press.isDragging = true;
      }
      setPreview(getEdited(event, press));
    }
    function onUp(event: PointerEvent): void {
      const press = pressRef.current;
      if (press?.isDragging) {
        draggedRef.current = true;
        setTimeout(() => (draggedRef.current = false), 0);
        latest.current.onEdit(getEdited(event, press));
      }
      end();
    }
    function onTouchMove(event: TouchEvent): void {
      if (pressRef.current?.isDragging) event.preventDefault();
    }
    function end(): void {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      pressRef.current = null;
      setPreview(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', end);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      end();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', end);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  /**
   * Starts a press on a block, or on one of its edges.
   *
   * @param event - The pointerdown.
   * @param place - Where the block is.
   * @param mode - Whether the press moves the block or trims it from its start or end.
   */
  function startPress(event: ReactPointerEvent, place: BlockPlace, mode: DragMode): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    pressRef.current = {
      mode,
      place,
      x: event.clientX,
      y: event.clientY,
      isTouch: event.pointerType === 'touch',
      isDragging: false,
    };
    if (event.pointerType === 'touch') {
      holdTimerRef.current = setTimeout(() => {
        const press = pressRef.current;
        if (!press) return;
        press.isDragging = true;
        navigator.vibrate?.(12);
      }, HOLD_TIME);
    }
  }
  return { startPress, preview, wasDragged: () => draggedRef.current };
}
