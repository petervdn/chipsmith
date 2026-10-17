// Moves a track's level meter every frame while its song plays, and until it has fallen after, by
// its style alone (no render).
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { readTrackPeak } from '../playback/track-taps.ts';
import { usePlayerStore } from '../stores/player-store.ts';
import type { MeterState } from './track-meter.ts';
import { SILENT_METER, getDecibels, getMeterShare, isSettled, stepMeter } from './track-meter.ts';

/** The longest step of time a frame counts, in seconds, so a tab woken from the background eases. */
const LONGEST_STEP = 0.1;

/**
 * Keeps a track's meter at the level the track plays at, eased as track-meter.ts moves it. It sets
 * `--level` and `--peak` on the meter, each the share of its height.
 *
 * @param meterRef - The ref of the meter's element.
 * @param track - Which track it shows.
 * @param track.songId - The id of the song the track is in.
 * @param track.trackId - The id of the track.
 */
export function useTrackMeter(
  meterRef: RefObject<HTMLElement | null>,
  { songId, trackId }: { songId: string; trackId: string },
): void {
  const meterState = useRef<MeterState>(SILENT_METER);
  const isPlaying = usePlayerStore(
    (state) => state.song?.song.id === songId && state.mode === 'playing',
  );
  useEffect(() => {
    const meter = meterRef.current;
    if (!meter || (!isPlaying && isSettled(meterState.current))) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function follow(now) {
      const seconds = Math.min(LONGEST_STEP, Math.max(0, (now - last) / 1000));
      last = now;
      const peak = isPlaying ? readTrackPeak(trackId) : null;
      meterState.current = stepMeter(meterState.current, getDecibels(peak ?? 0), seconds);
      meter.style.setProperty('--level', `${getMeterShare(meterState.current.level)}`);
      meter.style.setProperty('--peak', `${getMeterShare(meterState.current.peak)}`);
      if (isPlaying || !isSettled(meterState.current)) frame = requestAnimationFrame(follow);
    });
    return () => cancelAnimationFrame(frame);
  }, [meterRef, isPlaying, trackId]);
}
