// Two boxes that scroll sideways kept at the same place: the timeline's head and its tracks, which
// are drawn apart so the head can stay in view. Whichever is scrolled, by a hand, the wheel, a
// drag near an edge or following the playhead, the other follows. A box's scroll event comes a
// frame after its scroll, so the event of a scroll this hook made itself is let go: followed, it
// would pull the other box back to where it was a frame ago (the jumps while zooming fast).
import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Keeps two boxes scrolled sideways to the same place.
 *
 * @param firstRef - The ref of one box.
 * @param secondRef - The ref of the other.
 */
export function useScrollSync(
  firstRef: RefObject<HTMLElement | null>,
  secondRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const first = firstRef.current;
    const second = secondRef.current;
    if (!first || !second) return;
    const written = new Map<HTMLElement, number>();
    function follow(from: HTMLElement, to: HTMLElement): void {
      const echo = written.get(from);
      written.delete(from);
      if (echo === from.scrollLeft) return;
      if (to.scrollLeft === from.scrollLeft) return;
      to.scrollLeft = from.scrollLeft;
      written.set(to, to.scrollLeft);
    }
    function followFirst(): void {
      if (first && second) follow(first, second);
    }
    function followSecond(): void {
      if (first && second) follow(second, first);
    }
    first.addEventListener('scroll', followFirst, { passive: true });
    second.addEventListener('scroll', followSecond, { passive: true });
    followFirst();
    return () => {
      first.removeEventListener('scroll', followFirst);
      second.removeEventListener('scroll', followSecond);
    };
  }, [firstRef, secondRef]);
}
