// Which tracks are muted and soloed while the song is edited: heard in playback, drawn faint on the
// timeline. Mute is the track's own (an edit, saved with the song); solo is the view's, not saved.
import { useState } from 'react';
import type { Track } from '../../shared/song.schema.ts';
import type { TrackMix } from './track-mix.ts';

/**
 * Keeps the solo of an edited song's tracks, and gives their mix with the mute the tracks hold.
 *
 * @param tracks - The draft's tracks.
 * @param onToggleMute - Called with a track's id to mute or unmute it, as an edit of the song.
 * @returns The mix, and `toggleMute` and `toggleSolo` for a track's id.
 */
export function useTrackMix(tracks: Track[], onToggleMute: (trackId: string) => void) {
  const [soloed, setSoloed] = useState<string[]>([]);
  const muted = tracks.filter((track) => track.isMuted).map((track) => track.id);
  const mix: TrackMix = { muted, soloed };
  return {
    mix,
    toggleMute: onToggleMute,
    toggleSolo: (trackId: string) =>
      setSoloed((current) =>
        current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId],
      ),
  };
}
