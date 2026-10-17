// Dragging the timeline itself with a mouse, where there is no block (a lane's empty space, the
// strip under the tracks), scrolls it, the lanes following the pointer. A touch screen scrolls it
// with a swipe already, so only a mouse is followed here.
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { usePressDrag } from './use-press-drag.ts';

/**
 * Lets the timeline in `scrollRef` be dragged sideways with a mouse.
 *
 * @param scrollRef - The element the timeline scrolls sideways in.
 * @returns `startPan` for the pointerdown on empty space, and `wasPanned`, true just after a pan so
 *   the click it ends with can be ignored.
 */
export function useTimelinePan(scrollRef: RefObject<HTMLElement | null>) {
  const press = usePressDrag<number>({
    onDrag: (event, scrollLeft, origin) => {
      if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - (event.clientX - origin.x);
    },
    onDrop: () => {},
    onEnd: () => {},
  });

  /**
   * Starts a pan from a press on empty space; a press on anything in it (a block) is left alone.
   *
   * @param event - The pointerdown.
   */
  function startPan(event: ReactPointerEvent): void {
    const scroller = scrollRef.current;
    if (event.pointerType !== 'mouse' || event.target !== event.currentTarget || !scroller) return;
    event.preventDefault();
    press.startPress(event, scroller.scrollLeft);
  }
  return { startPan, wasPanned: press.wasDragged };
}
