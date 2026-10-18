// Two boxes that scroll sideways kept at the same place: the timeline's head and its tracks, which
// are drawn apart so the head can stay in view. Whichever is scrolled, by a hand, the wheel, a
// drag near an edge or following the playhead, the other follows in the same frame.
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
    function follow(from: HTMLElement, to: HTMLElement): void {
      if (to.scrollLeft !== from.scrollLeft) to.scrollLeft = from.scrollLeft;
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
