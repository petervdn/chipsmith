// Dragging the right edge of the timeline's track names makes them wider or narrower; the width is
// kept in the preferences, so it stays after a reload.
import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { getTrackNameWidth } from './track-name-width.ts';

/** The pointer handlers for the track names' edge. */
export type ResizeHandlers = {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

/** What a drag of the edge started from: the pointer's x and the width then, in pixels. */
type ResizeStart = { x: number; width: number };

/**
 * Lets the track names' edge be dragged to resize them.
 *
 * @returns `trackNameWidth`, how wide they are drawn in pixels, and `resizeHandlers`, the pointer
 *   handlers for the edge.
 */
export function useTrackNameResize() {
  const trackNameWidth = usePreferencesStore((state) => state.trackNameWidth);
  const setTrackNameWidth = usePreferencesStore((state) => state.setTrackNameWidth);
  const startRef = useRef<ResizeStart | null>(null);
  const resizeHandlers: ResizeHandlers = {
    onPointerDown: (event: ReactPointerEvent) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      startRef.current = { x: event.clientX, width: trackNameWidth };
    },
    onPointerMove: (event: ReactPointerEvent) => {
      const start = startRef.current;
      if (start) setTrackNameWidth(getTrackNameWidth(start.width + event.clientX - start.x));
    },
    onPointerUp: () => {
      startRef.current = null;
    },
    onPointerCancel: () => {
      startRef.current = null;
    },
  };
  return { trackNameWidth, resizeHandlers };
}
