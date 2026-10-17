/**
 * Where the pointer is on the timeline's lanes, read from the page: the track's lane under a point,
 * and the tick a point is at. The lanes are found by the attribute that names their track, so this
 * holds wherever the timeline is scrolled to. Knows nothing of React.
 */

/** The attribute on a track's lane that names its track. */
export const LANE_TRACK_ATTRIBUTE = 'data-track-id';

/**
 * Returns the track whose lane is under a point, and where that lane starts on the screen.
 *
 * @param x - The point's x, in pixels from the window's left.
 * @param y - The point's y, in pixels from the window's top.
 * @returns The track's id and its lane's left edge, or null when no lane is there.
 */
export function getLaneAt(x: number, y: number): { trackId: string; left: number } | null {
  const lane = document.elementFromPoint(x, y)?.closest(`[${LANE_TRACK_ATTRIBUTE}]`);
  const trackId = lane?.getAttribute(LANE_TRACK_ATTRIBUTE);
  return lane && trackId ? { trackId, left: lane.getBoundingClientRect().left } : null;
}

/**
 * Returns the tick of the song a point's x is at, by where the lanes start now.
 *
 * @param x - The point's x, in pixels from the window's left.
 * @param pixelsPerTick - How wide a tick is drawn.
 * @returns The tick (below 0 left of the lanes), or null when there are no lanes.
 */
export function getLaneTicks(x: number, pixelsPerTick: number): number | null {
  const lane = document.querySelector(`[${LANE_TRACK_ATTRIBUTE}]`);
  return lane ? (x - lane.getBoundingClientRect().left) / pixelsPerTick : null;
}
