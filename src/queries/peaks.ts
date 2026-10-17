/**
 * A clip's waveform as peaks, from its audio (decoded once, shared with the player). A clip's audio
 * never changes, so its peaks are read once and kept.
 */
import { useQuery } from '@tanstack/react-query';
import { getPeaks } from '../editor/clip-peaks.ts';
import { loadAudio } from '../playback/audio-engine.ts';
import { getClipAudioUrl } from '../stores/player-store.ts';
import { getQueryKey } from './client.ts';

/** The peaks of a clip's audio, PEAKS_PER_SECOND to a second. */
export function useClipPeaks(clipId: string) {
  return useQuery({
    queryKey: getQueryKey({ type: 'peaks', clipId }),
    queryFn: async () => {
      const audio = await loadAudio(getClipAudioUrl(clipId));
      const channels = Array.from({ length: audio.numberOfChannels }, (_unused, i) =>
        audio.getChannelData(i),
      );
      return getPeaks(channels, audio.sampleRate);
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
