// The tracks kept in view under the editor's head while the page scrolls down to what is under them
// (docs/adr/0044): their box sticks (by its CSS, on a screen wide enough) and shrinks to one track's
// row as the page goes past (tracks-window.ts), by its style alone, every scroll; and a track brought
// into that row on request. Where the box does not stick, it is left as it is.
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { LANE_TRACK_ATTRIBUTE } from './lane-position.ts';
import { getTracksWindow } from './tracks-window.ts';

/**
 * Keeps the tracks' box shrinking to one row as the page scrolls past it.
 *
 * @param boxRef - The ref of the tracks' box, which scrolls them.
 * @param markRef - The ref of an empty element right before the box, which marks where it starts.
 * @param roomRef - The ref of an empty element right after the box, which keeps the room it leaves
 *   as it shrinks (not the box's margin, which would count in where the box may stick).
 * @param rowHeight - How tall a track's row is drawn, with its line, in pixels.
 * @returns `showTrack`, which scrolls the tracks inside the box to a track's row.
 */
export function useStickyTracks(
  boxRef: RefObject<HTMLElement | null>,
  markRef: RefObject<HTMLElement | null>,
  roomRef: RefObject<HTMLElement | null>,
  rowHeight: number,
) {
  const previousHeightRef = useRef<number | null>(null);
  useEffect(() => {
    const box = boxRef.current;
    const mark = markRef.current;
    const room = roomRef.current;
    const content = box?.firstElementChild;
    if (!box || !mark || !room || !(content instanceof HTMLElement)) return;
    function place(): void {
      if (!box || !mark || !room || !(content instanceof HTMLElement)) return;
      const style = getComputedStyle(box);
      if (style.position !== 'sticky') {
        box.style.height = '';
        room.style.height = '';
        previousHeightRef.current = null;
        return;
      }
      // the box's own lines and its sideways scrollbar, which its content does not count
      const frame = box.offsetHeight - box.clientHeight;
      const tracksWindow = getTracksWindow({
        contentHeight: content.offsetHeight,
        rowHeight,
        scrolledPast: parseFloat(style.top) - mark.getBoundingClientRect().top,
        previousHeight: previousHeightRef.current,
      });
      previousHeightRef.current = tracksWindow.height;
      box.style.height = `${tracksWindow.height + frame}px`;
      room.style.height = `${tracksWindow.roomBelow}px`;
      if (tracksWindow.scrollTop !== null) box.scrollTop = tracksWindow.scrollTop;
    }
    const observer = new ResizeObserver(place);
    observer.observe(content);
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    place();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, [boxRef, markRef, roomRef, rowHeight]);

  /**
   * Scrolls the tracks inside the box so a track's row is at its top: the one row in view once
   * the box has shrunk.
   *
   * @param trackId - The track.
   */
  function showTrack(trackId: string): void {
    const box = boxRef.current;
    const row = box?.querySelector(
      `[${LANE_TRACK_ATTRIBUTE}="${CSS.escape(trackId)}"]`,
    )?.parentElement;
    if (box && row) box.scrollTop = row.offsetTop;
  }
  return { showTrack };
}
