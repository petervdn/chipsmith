// Moves the playhead's line every frame while this song plays, by its style alone (no render), and
// puts it at the cursor when the song is stopped.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/** Keeps `lineRef` at the second playing, or at `cursor` while this song does not play. */
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
