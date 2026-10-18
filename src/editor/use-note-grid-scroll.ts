/**
 * Where the note grid's box is scrolled across (docs/adr/0040): to the middle of the notes when a
 * channel is first shown, and kept on the same pitches when the range laid out grows below them.
 * Knows nothing of the notes or their edits.
 */
import { useLayoutEffect, useRef } from 'react';

/** What the grid's scroll is worked out from. */
export type NoteGridScroll = {
  /** The channel shown; a new one is scrolled to its notes. */
  channel: number | null;
  /** The lowest pitch laid out. */
  lowestPitch: number;
  /** The pitch to put in the middle at first. */
  middlePitch: number;
  /** The width of a pitch's column, in pixels. */
  columnWidth: number;
  /** The width of the bar numbers' column that stays at the left, in pixels. */
  gutter: number;
};

/**
 * Scrolls the note grid's box across to its notes.
 *
 * @param scroll - What the scroll is worked out from.
 * @param scroll.channel - The channel shown.
 * @param scroll.lowestPitch - The lowest pitch laid out.
 * @param scroll.middlePitch - The pitch to put in the middle at first.
 * @param scroll.columnWidth - The width of a pitch's column, in pixels.
 * @param scroll.gutter - The width of the bar numbers' column, in pixels.
 * @returns The ref to put on the box that scrolls.
 */
export function useNoteGridScroll({
  channel,
  lowestPitch,
  middlePitch,
  columnWidth,
  gutter,
}: NoteGridScroll) {
  const boxRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef<{ channel: number; lowestPitch: number } | null>(null);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || channel === null) return;
    const shown = shownRef.current;
    shownRef.current = { channel, lowestPitch };
    if (shown?.channel === channel) {
      box.scrollLeft += (shown.lowestPitch - lowestPitch) * columnWidth;
      return;
    }
    const middle = (middlePitch - lowestPitch + 0.5) * columnWidth;
    box.scrollLeft = middle - (box.clientWidth - gutter) / 2;
  });
  return boxRef;
}
