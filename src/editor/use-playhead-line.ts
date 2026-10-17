// Moves the playhead's line every frame while this song plays, by its style alone (no render), and
// puts it at the cursor when the song is stopped.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Keeps the playhead's line at the second playing while this song plays, and at the cursor while it
 * does not.
 *
 * @param lineRef - The ref of the playhead's line.
 * @param place - Where the line goes.
 * @param place.songId - The id of the song the timeline shows.
 * @param place.cursor - The cursor, in seconds, where the line stands while the song does not play.
 * @param place.pixelsPerSecond - How wide a second is drawn, in pixels.
 */
export function usePlayheadLine(
  lineRef: RefObject<HTMLElement | null>,
  { songId, cursor, pixelsPerSecond }: { songId: string; cursor: number; pixelsPerSecond: number },
): void {
  const isPlaying = usePlayerStore(
    (state) => state.song?.song.id === songId && state.mode === 'playing',
  );
  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    function place(seconds: number): void {
      if (line) line.style.transform = `translateX(${seconds * pixelsPerSecond}px)`;
    }
    if (!isPlaying) {
      place(cursor);
      return;
    }
    let frame = requestAnimationFrame(function follow() {
      place(getSongPosition() ?? cursor);
      frame = requestAnimationFrame(follow);
    });
    return () => cancelAnimationFrame(frame);
  }, [lineRef, isPlaying, cursor, pixelsPerSecond]);
}
