// A press anywhere on the page outside an element, told to a callback while it is wanted (a
// selection in a panel let go when the page is used elsewhere). Knows nothing of what the element is.
import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Calls back when the pointer goes down outside an element, while it is active.
 *
 * @param element - The element a press inside of is not told.
 * @param onOutside - Called on a press outside it.
 * @param isActive - Whether to listen: false while there is nothing to let go.
 */
export function usePointerOutside(
  element: RefObject<HTMLElement | null>,
  onOutside: () => void,
  isActive: boolean,
) {
  useEffect(() => {
    if (!isActive) return;
    function handlePointerDown(event: PointerEvent): void {
      const inside = element.current;
      if (inside && event.target instanceof Node && inside.contains(event.target)) return;
      onOutside();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [element, onOutside, isActive]);
}
