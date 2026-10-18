// A clip played on its own from its section of the details: whether it plays, play and pause, play
// from a share of it; and the part played of its waveform shown every frame while it plays, by the
// played layer's style alone (no render), left where it paused when it does not.
import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Plays a clip on its own, and keeps the played layer of its waveform cut at the playhead.
 *
 * @param clip - The clip.
 * @param playedRef - The ref of the waveform's played layer, shown up to the playhead.
 * @returns `isPlaying` (loading or playing), `toggle` (play from where it paused, or pause), and
 *   `playAt` (play from a share of the clip, 0 to 1).
 */
export function useClipPlayer(clip: Clip, playedRef: RefObject<HTMLElement | null>) {
  const mode = usePlayerStore((state) => (state.clipId === clip.id ? state.mode : 'stopped'));
  const pausedAt = usePlayerStore((state) => (state.clipId === clip.id ? state.from : 0));
  const playClip = usePlayerStore((state) => state.playClip);
  const stopSong = usePlayerStore((state) => state.stopSong);
  const isPlaying = mode !== 'stopped';
  useEffect(() => {
    const played = playedRef.current;
    if (!played) return;
    function cutAt(seconds: number): void {
      const share = clip.seconds > 0 ? Math.min(1, Math.max(0, seconds / clip.seconds)) : 0;
      if (played) played.style.clipPath = `inset(0 ${(1 - share) * 100}% 0 0)`;
    }
    if (mode !== 'playing') {
      cutAt(pausedAt);
      return;
    }
    let frame = requestAnimationFrame(function follow() {
      cutAt(getSongPosition() ?? pausedAt);
      frame = requestAnimationFrame(follow);
    });
    return () => cancelAnimationFrame(frame);
  }, [playedRef, mode, pausedAt, clip.seconds]);
  /** Plays from where it paused (from the start once played through), or pauses. */
  function toggle(): void {
    if (isPlaying) stopSong(getSongPosition() ?? pausedAt);
    else void playClip(clip, pausedAt);
  }
  /**
   * Plays the clip from a share of it.
   *
   * @param share - How far into the clip, 0 to 1.
   */
  function playAt(share: number): void {
    void playClip(clip, share * clip.seconds);
  }
  return { isPlaying, toggle, playAt };
}
