/**
 * The one player of the page (not persisted: a reload starts with nothing playing): which song, whether
 * it is loading, playing or stopped, and where. Components read it with a selector and change it with
 * its actions; the audio itself is playback/audio-engine.ts's.
 */
import { create } from 'zustand';
import type { SongDetail } from '../../shared/api.types.ts';
import { getEnd, getStretches } from '../playback/schedule.ts';
import { playStretches, stopPlaying, unlockAudio } from '../playback/audio-engine.ts';

/** Whether the player is stopped, loading a song or playing it. */
export type PlayerMode = 'stopped' | 'loading' | 'playing';

/** What the player is doing, and how to change it. */
type PlayerStore = {
  song: SongDetail | null;
  mode: PlayerMode;
  /** How much of the song's audio has loaded, 0 to 1, while loading. */
  loaded: number;
  /** Where play starts or started, in seconds. */
  from: number;
  /** The song's length in seconds. */
  end: number;
  error: string | null;
  /** Plays a song from a second; call it from a tap. */
  playSong: (song: SongDetail, from?: number) => Promise<void>;
  /** Stops, keeping the place it stopped at. */
  stopSong: (at: number) => void;
  /** Moves to a second of the song, playing on from there if it was playing. */
  seekSong: (to: number) => void;
};

/**
 * Returns the URL of a clip's audio.
 *
 * @param clipId - The id of the clip.
 * @returns The URL.
 */
export function getClipAudioUrl(clipId: string): string {
  return `/media/clips/${encodeURIComponent(clipId)}/audio.flac`;
}

/** The player store. */
export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  song: null,
  mode: 'stopped',
  loaded: 0,
  from: 0,
  end: 0,
  error: null,
  playSong: async (song, from = 0) => {
    const unlocking = unlockAudio();
    const stretches = getStretches(song.song, song.clips);
    const end = getEnd(stretches);
    const start = from >= end ? 0 : from;
    set({ song, mode: 'loading', loaded: 0, from: start, end, error: null });
    await unlocking;
    try {
      const isStarted = await playStretches(
        stretches,
        getClipAudioUrl,
        start,
        end,
        (loaded) => set({ loaded }),
        () => set({ mode: 'stopped', from: 0 }),
      );
      if (isStarted) set({ mode: 'playing' });
    } catch (error) {
      set({ mode: 'stopped', error: error instanceof Error ? error.message : String(error) });
    }
  },
  stopSong: (at) => {
    stopPlaying();
    set({ mode: 'stopped', from: at });
  },
  seekSong: (to) => {
    const { song, mode, playSong } = get();
    if (song && mode !== 'stopped') void playSong(song, to);
    else set({ from: to });
  },
}));
