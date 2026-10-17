// While the song plays and following is on, the timeline turns the page with the playhead: when it
// nears the right edge of what is in view (or is out of view), the timeline scrolls to put it near
// the left again.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/** How near the right edge, in pixels, the playhead turns the page. */
const AHEAD = 32;

/** How far from the left edge, in pixels, the playhead is put when the page turns. */
const BEHIND = 24;

/**
 * Scrolls the timeline in `scrollRef` along with the playhead while the song plays.
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
      const x = seconds * pixelsPerSecond;
      const inView = scroller.clientWidth - leftInset;
      if (x < scroller.scrollLeft || x > scroller.scrollLeft + inView - AHEAD) {
        scroller.scrollLeft = x - BEHIND;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollRef, isOn, isPlaying, pixelsPerSecond, leftInset]);
}
