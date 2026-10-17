// The editor's metronome clicking while its song plays, when it is switched on: started when the
// song starts playing at a tempo, stopped when it stops, pauses, or the metronome is switched off.
import { useEffect } from 'react';
import { startMetronome } from '../playback/metronome.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';

/**
 * Clicks along with the opened song while it plays and the metronome is on.
 *
 * @param isPlaying - Whether the opened song is playing.
 * @param song - The song's tempo.
 * @param song.bpm - Its beats a minute.
 * @param song.beats - Its beats in a bar.
 */
export function useMetronome(isPlaying: boolean, { bpm, beats }: { bpm: number; beats: number }) {
  const isOn = usePreferencesStore((state) => state.isMetronomeOn);
  useEffect(() => {
    if (!isOn || !isPlaying) return undefined;
    return startMetronome({ bpm, beatsPerBar: beats });
  }, [isOn, isPlaying, bpm, beats]);
}
