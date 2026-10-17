// The width of an element on the page, kept current as it changes (a phone turned, a window resized).
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** The width of `ref`'s element in pixels, 0 until it is on the page. */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
