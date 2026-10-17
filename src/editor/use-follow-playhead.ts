// While the song plays and following is on, the timeline keeps the playhead in the middle of what is
// in view: it scrolls along with it every frame, except where the song's start or the timeline's end
// leave no room to, so the playhead runs from the left to the middle and from the middle to the end.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Scrolls the timeline in `scrollRef` along with the playhead while the song plays, keeping it in
 * the middle of the view where it can.
 *
 * @param scrollRef - The element the timeline scrolls sideways in.
 * @param follow - What following needs.
 * @param follow.songId - The id of the song the timeline shows.
 * @param follow.isOn - Whether following is switched on.
 * @param follow.pixelsPerSecond - How wide a second is drawn.
 * @param follow.leftInset - How much of the timeline's left is covered (the track names), in pixels.
 */
export function useFollowPlayhead(
  scrollRef: RefObject<HTMLElement | null>,
  {
    songId,
    isOn,
    pixelsPerSecond,
    leftInset,
  }: { songId: string; isOn: boolean; pixelsPerSecond: number; leftInset: number },
): void {
  const isPlaying = usePlayerStore(
    (state) => state.song?.song.id === songId && state.mode === 'playing',
  );
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!isOn || !isPlaying || !scroller) return;
    let frame = requestAnimationFrame(function follow() {
      frame = requestAnimationFrame(follow);
      const seconds = getSongPosition();
      if (seconds === null) return;
      const inView = scroller.clientWidth - leftInset;
      // the browser keeps scrollLeft between the start and the end, which is the "where it can"
      scroller.scrollLeft = Math.round(seconds * pixelsPerSecond - inView / 2);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollRef, isOn, isPlaying, pixelsPerSecond, leftInset]);
}
