/**
 * Which tooltip shows: the `data-tooltip` of what the mouse rests on or the keyboard has moved to,
 * after a short moment, or at once when one showed just before (moving along a row of controls). A
 * press, a scroll, Escape or moving away puts it away; it comes back only when the pointer enters
 * again. While it shows, what it is for is described by it (`aria-describedby`).
 */
import { useEffect, useState } from 'react';
import type { ScreenBox } from './tooltip-place.ts';

/** How long the pointer rests before a tooltip shows, in milliseconds. */
const SHOW_DELAY = 150;

/** How long after a tooltip went away the next one shows at once, in milliseconds. */
const WARM_TIME = 500;

/** The id of the tooltip's element, for `aria-describedby`. */
export const TOOLTIP_ID = 'tooltip';

/** A tooltip that shows: its text, and the box of what it is for. */
export type ShownTooltip = { text: string; target: ScreenBox };

/**
 * Returns the element whose tooltip an event's target shows, if it has one.
 *
 * @param target - What the event happened on.
 * @returns The nearest element with a tooltip that is not empty, or null.
 */
function getTooltipElement(target: EventTarget | null): Element | null {
  const element = target instanceof Element ? target.closest('[data-tooltip]') : null;
  return element?.getAttribute('data-tooltip') ? element : null;
}

/**
 * Follows the pointer and the keyboard over the page and gives the tooltip to show.
 *
 * @returns The tooltip to show, or null when none shows.
 */
export function useTooltip(): ShownTooltip | null {
  const [shown, setShown] = useState<ShownTooltip | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: Element | null = null;
    let isShowing = false;
    let hiddenAt = -Infinity;
    function hide(): void {
      clearTimeout(timer);
      current?.removeAttribute('aria-describedby');
      if (isShowing) hiddenAt = performance.now();
      isShowing = false;
      setShown(null);
    }
    function showLater(element: Element | null): void {
      if (element === current) return;
      hide();
      current = element;
      if (!element) return;
      const isWarm = performance.now() - hiddenAt < WARM_TIME;
      timer = setTimeout(
        () => {
          const text = element.getAttribute('data-tooltip');
          if (!text || !element.isConnected) return;
          element.setAttribute('aria-describedby', TOOLTIP_ID);
          isShowing = true;
          setShown({ text, target: element.getBoundingClientRect() });
        },
        isWarm ? 0 : SHOW_DELAY,
      );
    }
    function onPointerOver(event: PointerEvent): void {
      if (event.pointerType === 'mouse') showLater(getTooltipElement(event.target));
    }
    function onPointerOut(event: PointerEvent): void {
      if (!event.relatedTarget) showLater(null);
    }
    function onFocusIn(event: FocusEvent): void {
      const element = getTooltipElement(event.target);
      if (element?.matches(':focus-visible')) showLater(element);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') hide();
    }
    function forgetAndHide(): void {
      showLater(null);
    }
    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', forgetAndHide);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', hide, true);
    return () => {
      hide();
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', forgetAndHide);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);
  return shown;
}
