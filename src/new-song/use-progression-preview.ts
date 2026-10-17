// A progression heard on New: one at a time, played from a tap (which wakes the audio), stopped by
// another, by ■, or when the page closes; which one plays is known until it ends.
import { useEffect, useRef, useState } from 'react';
import type { Chord } from '../../shared/harmony.types.ts';
import { unlockAudio } from '../playback/audio-engine.ts';
import type { PreviewStyle } from '../playback/progression-preview.ts';
import { playProgression } from '../playback/progression-preview.ts';

/**
 * Plays progressions to hear them, one at a time.
 *
 * @returns Which one plays (`playingId`, or null), `play` (by its id, its chords, the key's note and
 *   how its chords are heard; stops the one playing) and `stop`.
 */
export function useProgressionPreview() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  function stop(): void {
    stopRef.current?.();
    stopRef.current = null;
    setPlayingId(null);
  }
  useEffect(() => () => stopRef.current?.(), []);
  return {
    playingId,
    play: async (id: string, chords: Chord[], note: string, style: PreviewStyle) => {
      stop();
      await unlockAudio();
      stopRef.current = playProgression(chords, note, style, () => {
        stopRef.current = null;
        setPlayingId(null);
      });
      setPlayingId(id);
    },
    stop,
  };
}
