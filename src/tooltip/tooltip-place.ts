// Where a tooltip goes: under what it is for, or above when there is no room under it, centred on it
// and kept inside the window. It knows nothing of the page: given boxes, gives a place.

/** The space kept between a tooltip and what it is for, in pixels. */
const GAP = 6;

/** The space kept between a tooltip and the window's edges, in pixels. */
const MARGIN = 8;

/** A box on the screen, in pixels from the window's top left. */
export type ScreenBox = { left: number; top: number; right: number; bottom: number };

/** A size, in pixels. */
export type ScreenSize = { width: number; height: number };

/**
 * Returns where a tooltip's top left goes.
 *
 * @param place - What the tooltip is for, its size and the window's.
 * @param place.target - The box of what the tooltip is for.
 * @param place.size - The tooltip's size.
 * @param place.viewport - The window's size.
 * @returns The tooltip's left and top, in pixels from the window's top left.
 */
export function getTooltipPlace({
  target,
  size,
  viewport,
}: {
  target: ScreenBox;
  size: ScreenSize;
  viewport: ScreenSize;
}): { left: number; top: number } {
  const below = target.bottom + GAP;
  const above = target.top - GAP - size.height;
  const isAbove = below + size.height > viewport.height - MARGIN && above >= MARGIN;
  const centred = (target.left + target.right) / 2 - size.width / 2;
  const left = Math.max(MARGIN, Math.min(centred, viewport.width - MARGIN - size.width));
  return { left, top: isAbove ? above : below };
}
