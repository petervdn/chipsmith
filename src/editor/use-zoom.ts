// How wide a bar is drawn: fitted to the timeline's width until zoomed, then a step in or out at a
// time, within bounds.
import { useState } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import type { Song } from '../../shared/song.types.ts';
import { getBlockSpans, getTicksPerBar, getTimelineBars } from './timeline.ts';

/** The narrowest and widest a bar is drawn, in pixels. */
const LEAST_PIXELS = 4;
const MOST_PIXELS = 600;
/** How much one step zooms in or out. */
const STEP = 1.5;
/** The width of the track names, which the fitted bars leave free. */
const TRACK_NAME_WIDTH = 92;

/** The pixels to a bar, and how to zoom in, out, or fit the song to `width`. */
export function useZoom({ song, clips, width }: { song: Song; clips: Clip[]; width: number }) {
  const [zoomed, setZoomed] = useState<number | null>(null);
  const bars = getTimelineBars(getBlockSpans(song, clips), getTicksPerBar(song));
  const fitted = Math.max(LEAST_PIXELS, (width - TRACK_NAME_WIDTH) / bars);
  const pixelsPerBar = zoomed ?? fitted;
  function zoomBy(factor: number): void {
    setZoomed(Math.min(MOST_PIXELS, Math.max(LEAST_PIXELS, pixelsPerBar * factor)));
  }
  return {
    pixelsPerBar,
    zoomIn: () => zoomBy(STEP),
    zoomOut: () => zoomBy(1 / STEP),
    fit: () => setZoomed(null),
  };
}
