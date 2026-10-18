/**
 * How much of the tracks shows while the page scrolls past them (docs/adr/0044): they stick under
 * the editor's head and, as the page goes on down, the part in view shrinks until one track's row is
 * left, the rest of their height kept as room under them so what follows does not jump. While it
 * shrinks the tracks scroll up inside it, as if the page scrolled them, so the last row is the one
 * left; once one row is left they stay where they were put. Given heights, gives heights; knows nothing of the page.
 */

/** The part of the tracks in view, and the room kept under it. */
export type TracksWindow = {
  /** How tall the tracks' box is drawn, its content's part only, in pixels. */
  height: number;
  /** The room under the box, so that it and the box are as tall as all the tracks. */
  roomBelow: number;
  /** Where the tracks are scrolled to inside the box, or null to leave them where they are. */
  scrollTop: number | null;
};

/**
 * Returns how much of the tracks is in view after the page has scrolled past where they start.
 *
 * @param heights - The heights, in pixels.
 * @param heights.contentHeight - How tall all the tracks are.
 * @param heights.rowHeight - How tall one track's row is, with its line: the least shown.
 * @param heights.scrolledPast - How far the page has scrolled past where the tracks stick.
 * @param heights.previousHeight - How tall the box was drawn before, or null the first time.
 * @returns The box's height, the room under it, and where to scroll the tracks inside it.
 */
export function getTracksWindow({
  contentHeight,
  rowHeight,
  scrolledPast,
  previousHeight,
}: {
  contentHeight: number;
  rowHeight: number;
  scrolledPast: number;
  previousHeight: number | null;
}): TracksWindow {
  const least = Math.min(contentHeight, rowHeight);
  const past = Math.max(0, scrolledPast);
  const height = Math.max(least, contentHeight - past);
  const isShrinking = height > least;
  // a scroll that jumps past the last of the shrinking still leaves the last row in view
  const hasJustShrunk = !isShrinking && (previousHeight ?? contentHeight) > least;
  return {
    height,
    roomBelow: contentHeight - height,
    scrollTop: isShrinking ? past : hasJustShrunk ? contentHeight - least : null,
  };
}
