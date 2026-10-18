// While something is dragged over the timeline, the pointer near its left or right edge scrolls it
// that way, faster the nearer the edge, so a block or clip can go past what is in view. Only inside
// the timeline, and only once the drag has been in it away from the edges: a clip dragged in from
// the clips column at its right crosses the right edge without scrolling. Each step of scrolling is
// told, so the drag can follow what moved under the pointer.
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** How near an edge, in pixels, the pointer starts the scrolling. */
const EDGE = 48;

/** The most the timeline scrolls in a frame, in pixels, with the pointer at the edge. */
const MOST_SPEED = 14;

/**
 * Scrolls the timeline in `scrollRef` while a drag goes on and the pointer is near one of its edges.
 *
 * @param scrollRef - The element the timeline scrolls sideways in.
 * @param drag - The drag and what to tell.
 * @param drag.isDragging - Whether something is being dragged.
 * @param drag.leftInset - How much of the timeline's left is covered (the track names), in pixels.
 * @param drag.onScroll - Called after each step of scrolling.
 */
export function useEdgeScroll(
  scrollRef: RefObject<HTMLElement | null>,
  {
    isDragging,
    leftInset,
    onScroll,
  }: { isDragging: boolean; leftInset: number; onScroll: () => void },
): void {
  const latest = useRef(onScroll);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    latest.current = onScroll;
  });
  useEffect(() => {
    function onMove(event: PointerEvent): void {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!isDragging || !scroller) return;
    let isArmed = false;
    let frame = requestAnimationFrame(function step() {
      frame = requestAnimationFrame(step);
      const pointer = pointerRef.current;
      if (!pointer || !scroller) return;
      const box = scroller.getBoundingClientRect();
      if (pointer.y < box.top || pointer.y > box.bottom) return;
      if (pointer.x < box.left || pointer.x > box.right) return;
      const fromLeft = pointer.x - (box.left + leftInset);
      const fromRight = box.right - pointer.x;
      if (fromLeft >= EDGE && fromRight >= EDGE) isArmed = true;
      if (!isArmed) return;
      const speed =
        fromRight < EDGE ? getSpeed(fromRight) : fromLeft < EDGE ? -getSpeed(fromLeft) : 0;
      if (speed === 0) return;
      const before = scroller.scrollLeft;
      scroller.scrollLeft += speed;
      if (scroller.scrollLeft !== before) latest.current();
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollRef, isDragging, leftInset]);
}

/**
 * Returns how fast to scroll with the pointer some way into the edge.
 *
 * @param distance - How far the pointer is from the edge, in pixels (below 0 past it).
 * @returns The pixels to scroll in a frame, from 1 at EDGE to MOST_SPEED at the edge.
 */
function getSpeed(distance: number): number {
  const depth = Math.min(1, Math.max(0, 1 - distance / EDGE));
  return Math.max(1, Math.round(depth * MOST_SPEED));
}
