// Scrolling up or down over the timeline zooms it in time, about the moment under the pointer, which
// stays where it is; a pinch on a trackpad zooms more strongly. A sideways scroll still scrolls.
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** How much one pixel of scrolling zooms; a trackpad pinch (ctrl + wheel) zooms more. */
const ZOOM_PER_PIXEL = 0.002;
const PINCH_PER_PIXEL = 0.01;

/**
 * Zooms the timeline in `scrollRef` with the wheel.
 *
 * @param scrollRef - The element the timeline scrolls sideways in.
 * @param zoom - The zoom now and how to change it.
 * @param zoom.pixelsPerBar - How wide a bar is drawn now.
 * @param zoom.trackNameWidth - How wide the track names are, left of the lanes, in pixels.
 * @param zoom.zoomTo - Sets how wide a bar is drawn (kept within its bounds).
 */
export function useWheelZoom(
  scrollRef: RefObject<HTMLElement | null>,
  {
    pixelsPerBar,
    trackNameWidth,
    zoomTo,
  }: { pixelsPerBar: number; trackNameWidth: number; zoomTo: (pixelsPerBar: number) => void },
): void {
  const latest = useRef({ pixelsPerBar, trackNameWidth, zoomTo });
  const anchorRef = useRef<{ bars: number; x: number } | null>(null);
  useEffect(() => {
    latest.current = { pixelsPerBar, trackNameWidth, zoomTo };
  });
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    function onWheel(event: WheelEvent): void {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.shiftKey) return;
      event.preventDefault();
      const now = latest.current;
      const x = event.clientX - (element?.getBoundingClientRect().left ?? 0) - now.trackNameWidth;
      const bars = ((element?.scrollLeft ?? 0) + x) / now.pixelsPerBar;
      anchorRef.current = { bars, x };
      const rate = event.ctrlKey ? PINCH_PER_PIXEL : ZOOM_PER_PIXEL;
      now.zoomTo(now.pixelsPerBar * Math.exp(-event.deltaY * rate));
    }
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [scrollRef]);
  useLayoutEffect(() => {
    const element = scrollRef.current;
    const anchor = anchorRef.current;
    if (!element || !anchor) return;
    element.scrollLeft = anchor.bars * pixelsPerBar - anchor.x;
    anchorRef.current = null;
  }, [scrollRef, pixelsPerBar]);
}
