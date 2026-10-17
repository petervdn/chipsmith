// How wide a bar is drawn: the whole timeline (the song and the bars after it) fitted to its width
// until zoomed, then a step in or out at a time, within bounds.
import { useState } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import type { Song } from '../../shared/song.types.ts';
import { getBlockSpans, getTicksPerBar, getTimelineBars } from './timeline.ts';

/** The narrowest and widest a bar is drawn, in pixels. */
const LEAST_PIXELS = 4;
const MOST_PIXELS = 600;
/** How much one step zooms in or out. */
const STEP = 1.5;

/**
 * Keeps how wide a bar is drawn: fitted to the timeline's width until zoomed, then a step in or out
 * at a time, within bounds.
 *
 * @param timeline - What the timeline shows, and its width.
 * @param timeline.song - The song.
 * @param timeline.clips - The clips the song's blocks play.
 * @param timeline.width - The timeline's width, in pixels, which the bars are fitted to.
 * @param timeline.trackNameWidth - The width of the track names, which the fitted bars leave free.
 * @returns `pixelsPerBar`, how wide a bar is drawn; `zoomIn` and `zoomOut`, which zoom a step; and
 * `fit`, which fits the timeline to the width again; `zoomTo`, which sets the width of a bar.
 */
export function useZoom({
  song,
  clips,
  width,
  trackNameWidth,
}: {
  song: Song;
  clips: Clip[];
  width: number;
  trackNameWidth: number;
}) {
  const [zoomed, setZoomed] = useState<number | null>(null);
  const bars = getTimelineBars(getBlockSpans(song, clips), getTicksPerBar(song));
  const fitted = Math.max(LEAST_PIXELS, (width - trackNameWidth) / bars);
  const pixelsPerBar = zoomed ?? fitted;
  function zoomTo(pixels: number): void {
    setZoomed(Math.min(MOST_PIXELS, Math.max(LEAST_PIXELS, pixels)));
  }
  function zoomBy(factor: number): void {
    zoomTo(pixelsPerBar * factor);
  }
  return {
    pixelsPerBar,
    zoomIn: () => zoomBy(STEP),
    zoomOut: () => zoomBy(1 / STEP),
    fit: () => setZoomed(null),
    zoomTo,
  };
}
