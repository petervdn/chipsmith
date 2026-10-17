// The top bar's height, given to the whole page as `--top-bar-height`, so what sticks under the bar
// knows where it ends: it is taller on a phone, where its rows wrap.
import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Keeps `--top-bar-height` on the page's root at the top bar's height, as it changes.
 *
 * @param barRef - The ref of the top bar.
 */
export function useTopBarHeight(barRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() =>
      root.style.setProperty('--top-bar-height', `${bar.getBoundingClientRect().height}px`),
    );
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--top-bar-height');
    };
  }, [barRef]);
}
