// Keeps the player hearing only the tracks the editor's mute and solo leave heard, each at its
// level, at once, also while the song plays; leaving the editor hears every track again, as
// rendered, until ▶ elsewhere plays a song as it was saved (track-taps.ts).
import { useEffect } from 'react';
import type { Track } from '../../shared/song.schema.ts';
import { setTrackVolumes, setUnheardTracks } from '../playback/track-taps.ts';
import type { TrackMix } from './track-mix.ts';
import { getUnheardTrackIds } from './track-mix.ts';

/**
 * Tells the player which tracks are not heard, and each track's level, whenever the mix or the
 * tracks change.
 *
 * @param tracks - The song's tracks, as edited.
 * @param mix - The tracks muted and soloed.
 */
export function useHeardTracks(tracks: Track[], mix: TrackMix): void {
  const unheardKey = getUnheardTrackIds(tracks, mix).join(' ');
  useEffect(() => {
    setUnheardTracks(unheardKey ? unheardKey.split(' ') : []);
  }, [unheardKey]);
  const volumesKey = tracks.map((track) => `${track.id}=${track.volume}`).join(' ');
  useEffect(() => {
    const pairs = volumesKey ? volumesKey.split(' ').map((pair) => pair.split('=')) : [];
    setTrackVolumes(
      Object.fromEntries(pairs.map(([trackId = '', volume]) => [trackId, Number(volume)])),
    );
  }, [volumesKey]);
  useEffect(
    () => () => {
      setUnheardTracks([]);
      setTrackVolumes({});
    },
    [],
  );
}
