/**
 * How wide the timeline's track names are drawn, left of the lanes: the width they start at and
 * the bounds a drag of their edge keeps to. Knows nothing of the page.
 */

/** How wide the track names are until their edge is dragged, in pixels. */
export const TRACK_NAME_WIDTH = 120;
/** The narrowest and widest the track names are drawn, in pixels. */
const LEAST_WIDTH = 64;
const MOST_WIDTH = 360;

/**
 * Returns a width for the track names, kept within its bounds and to whole pixels.
 *
 * @param width - The width asked for, in pixels.
 * @returns The width they are drawn at, in pixels.
 */
export function getTrackNameWidth(width: number): number {
  return Math.round(Math.min(MOST_WIDTH, Math.max(LEAST_WIDTH, width)));
}
