// An element's height, given to the whole page as a custom property, so what sticks under it knows
// where it ends: the top bar's (taller on a phone, where its rows wrap), the editor's head's.
import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Keeps a custom property on the page's root at an element's height, as it changes.
 *
 * @param ref - The ref of the element.
 * @param propertyName - The custom property, with its two dashes (`--top-bar-height`).
 */
export function useHeightProperty(ref: RefObject<HTMLElement | null>, propertyName: string): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = document.documentElement;
    function keepHeight(): void {
      if (!element) return;
      root.style.setProperty(propertyName, `${element.getBoundingClientRect().height}px`);
    }
    keepHeight();
    const observer = new ResizeObserver(keepHeight);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(propertyName);
    };
  }, [ref, propertyName]);
}
