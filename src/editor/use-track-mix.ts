// Which tracks are muted and soloed while the song is edited: heard in playback, drawn faint on the
// timeline, not saved with the song.
import { useState } from 'react';
import type { TrackMix } from './track-mix.ts';
import { EMPTY_MIX } from './track-mix.ts';

/**
 * Keeps the mute and solo of an edited song's tracks.
 *
 * @returns The mix, and `toggleMute` and `toggleSolo` for a track's id.
 */
export function useTrackMix() {
  const [mix, setMix] = useState<TrackMix>(EMPTY_MIX);
  function toggle(list: string[], trackId: string): string[] {
    return list.includes(trackId) ? list.filter((id) => id !== trackId) : [...list, trackId];
  }
  return {
    mix,
    toggleMute: (trackId: string) =>
      setMix(({ muted, soloed }) => ({ muted: toggle(muted, trackId), soloed })),
    toggleSolo: (trackId: string) =>
      setMix(({ muted, soloed }) => ({ muted, soloed: toggle(soloed, trackId) })),
  };
}
