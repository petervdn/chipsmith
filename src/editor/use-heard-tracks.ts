// Keeps the player hearing only the tracks the editor's mute and solo leave heard, at once, also
// while the song plays; leaving the editor hears every track again.
import { useEffect } from 'react';
import type { Track } from '../../shared/song.types.ts';
import { setUnheardTracks } from '../playback/track-taps.ts';
import type { TrackMix } from './track-mix.ts';
import { getUnheardTrackIds } from './track-mix.ts';

/**
 * Tells the player which tracks are not heard whenever the mix or the tracks change.
 *
 * @param tracks - The song's tracks, as edited.
 * @param mix - The tracks muted and soloed.
 */
export function useHeardTracks(tracks: Track[], mix: TrackMix): void {
  const unheardKey = getUnheardTrackIds(tracks, mix).join(' ');
  useEffect(() => {
    setUnheardTracks(unheardKey ? unheardKey.split(' ') : []);
  }, [unheardKey]);
  useEffect(() => () => setUnheardTracks([]), []);
}
