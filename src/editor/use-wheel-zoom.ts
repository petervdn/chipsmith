// Scrolling up or down over the timeline (its head or its tracks) zooms it in time, about the moment
// under the pointer, which stays where it is; a pinch on a trackpad zooms more strongly. A sideways
// scroll still scrolls. Wheel events can come faster than the page draws, so a zoom not drawn yet is
// kept and the next one builds on it; when it is drawn, every box is scrolled at once.
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** How much one pixel of scrolling zooms; a trackpad pinch (ctrl + wheel) zooms more. */
const ZOOM_PER_PIXEL = 0.002;
const PINCH_PER_PIXEL = 0.01;

/** A zoom asked for and not drawn yet: the width of a bar, and the moment kept under the pointer. */
type PendingZoom = { pixelsPerBar: number; bars: number; x: number };

/**
 * Zooms the timeline in the boxes of `scrollRefs` with the wheel.
 *
 * @param scrollRefs - The elements the timeline scrolls sideways in, all at the same place.
 * @param zoom - The zoom now and how to change it.
 * @param zoom.pixelsPerBar - How wide a bar is drawn now.
 * @param zoom.trackNameWidth - How wide the track names are, left of the lanes, in pixels.
 * @param zoom.zoomTo - Sets how wide a bar is drawn, and gives back the width set within its bounds.
 */
export function useWheelZoom(
  scrollRefs: RefObject<HTMLElement | null>[],
  {
    pixelsPerBar,
    trackNameWidth,
    zoomTo,
  }: { pixelsPerBar: number; trackNameWidth: number; zoomTo: (pixelsPerBar: number) => number },
): void {
  const latest = useRef({ pixelsPerBar, trackNameWidth, zoomTo });
  const pendingRef = useRef<PendingZoom | null>(null);
  const [firstRef, secondRef] = scrollRefs;
  useLayoutEffect(() => {
    latest.current = { pixelsPerBar, trackNameWidth, zoomTo };
  });
  useEffect(() => {
    const elements = [firstRef?.current, secondRef?.current].filter((element) => !!element);
    function onWheel(event: WheelEvent): void {
      const element = event.currentTarget;
      if (!(element instanceof HTMLElement)) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.shiftKey) return;
      event.preventDefault();
      const now = latest.current;
      const x = event.clientX - element.getBoundingClientRect().left - now.trackNameWidth;
      const pending =
        pendingRef.current?.pixelsPerBar === now.pixelsPerBar ? null : pendingRef.current;
      const pixels = pending?.pixelsPerBar ?? now.pixelsPerBar;
      const bars = pending
        ? pending.bars + (x - pending.x) / pixels
        : (element.scrollLeft + x) / pixels;
      const rate = event.ctrlKey ? PINCH_PER_PIXEL : ZOOM_PER_PIXEL;
      const zoomed = now.zoomTo(pixels * Math.exp(-event.deltaY * rate));
      pendingRef.current = zoomed === pixels ? pending : { pixelsPerBar: zoomed, bars, x };
    }
    for (const element of elements) {
      element.addEventListener('wheel', onWheel, { passive: false });
    }
    return () => {
      for (const element of elements) element.removeEventListener('wheel', onWheel);
    };
  }, [firstRef, secondRef]);
  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    for (const ref of [firstRef, secondRef]) {
      if (ref?.current) ref.current.scrollLeft = pending.bars * pixelsPerBar - pending.x;
    }
    pendingRef.current = null;
  }, [firstRef, secondRef, pixelsPerBar]);
}
