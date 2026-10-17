// A press that becomes a drag: with a mouse after a few pixels; on a touch screen after the finger
// holds still for a moment, so a swipe still scrolls. While dragging, each move is passed on; letting
// go is the drop; `redrag` passes the last move on again, for when what is under the pointer moved
// (the timeline scrolled). What is pressed (a block, a clip) is the caller's; this knows only the
// pointer.
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** Pixels a mouse moves before a press becomes a drag. */
const MOUSE_SLOP = 4;
/** Milliseconds a finger holds still before it can drag. */
const HOLD_TIME = 350;
/** Pixels a finger may move while holding; more is a swipe, which scrolls. */
const TOUCH_SLOP = 8;
/** How long the phone buzzes when a hold becomes a drag, in milliseconds. */
const HOLD_BUZZ = 12;

/** Where a press started on the screen, in pixels. */
export type PressOrigin = { x: number; y: number };

/** A press, before and while it is a drag. */
type Press<Pressed> = PressOrigin & {
  pressed: Pressed;
  isTouch: boolean;
  isDragging: boolean;
  /** The last move while dragging, passed on again by `redrag`. */
  lastMove: PointerEvent | null;
};

/** What a drag does: as it moves, when it is let go, and when it is over either way. */
export type PressDragHandlers<Pressed> = {
  onDrag: (event: PointerEvent, pressed: Pressed, origin: PressOrigin) => void;
  onDrop: (event: PointerEvent, pressed: Pressed, origin: PressOrigin) => void;
  onEnd: () => void;
};

/**
 * Lets presses become drags.
 *
 * @param handlers - What a drag does, kept current at every render.
 * @param handlers.onDrag - Called on each move while dragging.
 * @param handlers.onDrop - Called when a drag is let go.
 * @param handlers.onEnd - Called when a press is over: dropped, cancelled or never a drag.
 * @returns `startPress` for a pointerdown, with what was pressed; `redrag`, which passes the last
 *   move on again; and `wasDragged`, true just after a drag so the click it ends with can be ignored.
 */
export function usePressDrag<Pressed>({ onDrag, onDrop, onEnd }: PressDragHandlers<Pressed>) {
  const pressRef = useRef<Press<Pressed> | null>(null);
  const draggedRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ onDrag, onDrop, onEnd });
  useEffect(() => {
    latest.current = { onDrag, onDrop, onEnd };
  });

  useEffect(() => {
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
      press.lastMove = event;
      latest.current.onDrag(event, press.pressed, press);
    }
    function onUp(event: PointerEvent): void {
      const press = pressRef.current;
      if (press?.isDragging) {
        draggedRef.current = true;
        setTimeout(() => (draggedRef.current = false), 0);
        latest.current.onDrop(event, press.pressed, press);
      }
      end();
    }
    function onTouchMove(event: TouchEvent): void {
      if (pressRef.current?.isDragging) event.preventDefault();
    }
    function end(): void {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      const wasPressed = pressRef.current !== null;
      pressRef.current = null;
      if (wasPressed) latest.current.onEnd();
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
   * Starts a press.
   *
   * @param event - The pointerdown.
   * @param pressed - What was pressed, given back to the handlers.
   */
  function startPress(event: ReactPointerEvent, pressed: Pressed): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    pressRef.current = {
      pressed,
      x: event.clientX,
      y: event.clientY,
      isTouch: event.pointerType === 'touch',
      isDragging: false,
      lastMove: null,
    };
    if (event.pointerType === 'touch') {
      holdTimerRef.current = setTimeout(() => {
        const press = pressRef.current;
        if (!press) return;
        press.isDragging = true;
        navigator.vibrate?.(HOLD_BUZZ);
      }, HOLD_TIME);
    }
  }
  /** Passes the last move of the drag going on to `onDrag` again, if there is one. */
  function redrag(): void {
    const press = pressRef.current;
    if (press?.isDragging && press.lastMove) {
      latest.current.onDrag(press.lastMove, press.pressed, press);
    }
  }
  return { startPress, redrag, wasDragged: () => draggedRef.current };
}
