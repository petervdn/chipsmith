/**
 * Where the note grid's box is scrolled (docs/adr/0040, 0041): to the start and the middle of the
 * notes' pitches when a channel is first shown, and kept on the same pitches when the range laid out
 * grows above them. Knows nothing of the notes or their edits.
 */
import { useLayoutEffect, useRef } from 'react';

/** What the grid's scroll is worked out from. */
export type NoteGridScroll = {
  /** The channel shown; a new one is scrolled to its notes. */
  channel: number | null;
  /** The highest pitch laid out, at the top. */
  highestPitch: number;
  /** The pitch to put in the middle at first. */
  middlePitch: number;
  /** The height of a pitch's line, in pixels. */
  pitchHeight: number;
  /** The height of the bar numbers' ruler that stays at the top, in pixels. */
  rulerHeight: number;
};

/**
 * Scrolls the note grid's box to its notes.
 *
 * @param scroll - What the scroll is worked out from.
 * @param scroll.channel - The channel shown.
 * @param scroll.highestPitch - The highest pitch laid out.
 * @param scroll.middlePitch - The pitch to put in the middle at first.
 * @param scroll.pitchHeight - The height of a pitch's line, in pixels.
 * @param scroll.rulerHeight - The height of the bar numbers' ruler, in pixels.
 * @returns The ref to put on the box that scrolls.
 */
export function useNoteGridScroll({
  channel,
  highestPitch,
  middlePitch,
  pitchHeight,
  rulerHeight,
}: NoteGridScroll) {
  const boxRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef<{ channel: number; highestPitch: number } | null>(null);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || channel === null) return;
    const shown = shownRef.current;
    shownRef.current = { channel, highestPitch };
    if (shown?.channel === channel) {
      box.scrollTop += (highestPitch - shown.highestPitch) * pitchHeight;
      return;
    }
    const middle = (highestPitch - middlePitch + 0.5) * pitchHeight;
    box.scrollTop = middle - (box.clientHeight - rulerHeight) / 2;
    box.scrollLeft = 0;
  });
  return boxRef;
}
