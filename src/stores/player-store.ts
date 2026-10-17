/**
 * The one player of the page (not persisted: a reload starts with nothing playing): which song, or
 * which reference's audio (its mix or one channel alone), whether it is loading, playing or
 * stopped, where, and the loop it plays round, if any. Components read it with a selector and
 * change it with its actions; the audio itself is playback/audio-engine.ts's.
 */
import { create } from 'zustand';
import type { SongDetail } from '../../shared/api.types.ts';
import { getEnd, getStretches } from '../playback/schedule.ts';
import type { Stretch } from '../playback/schedule.ts';
import { playStretches, stopPlaying, unlockAudio } from '../playback/audio-engine.ts';
import type { Loop } from '../playback/loop.ts';
import { getLoopFrom } from '../playback/loop.ts';

/** Whether the player is stopped, loading a song or playing it. */
export type PlayerMode = 'stopped' | 'loading' | 'playing';

/** A reference's audio in the player: its mix, or one of its channels alone. */
export type ReferencePlay = {
  referenceId: string;
  /** The channel heard alone, from 1, or null for the mix. */
  channel: number | null;
  title: string;
  url: string;
  seconds: number;
};

/** The track a reference's audio plays on: one of its own, which the editor's mute and solo miss. */
const REFERENCE_TRACK = 'reference';

/** What the player is doing, and how to change it. */
type PlayerStore = {
  song: SongDetail | null;
  /** The reference's audio in the player, when that is what it plays instead of a song. */
  reference: ReferencePlay | null;
  mode: PlayerMode;
  /** How much of the song's audio has loaded, 0 to 1, while loading. */
  loaded: number;
  /** Where play starts or started, in seconds. */
  from: number;
  /** The song's length in seconds. */
  end: number;
  /** The loop it plays round, or null to play to the end. */
  loop: Loop | null;
  error: string | null;
  /** Plays a song from a second, round a loop if given; call it from a tap. */
  playSong: (song: SongDetail, from?: number, loop?: Loop | null) => Promise<void>;
  /** Plays a reference's mix or one of its channels from a second; call it from a tap. */
  playReference: (reference: ReferencePlay, from?: number) => Promise<void>;
  /** Stops, keeping the place it stopped at. */
  stopSong: (at: number) => void;
  /** Moves to a second of the song, playing on from there (round the same loop) if it was playing. */
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

/**
 * Returns the URL of a reference's mix, or of one of its channels alone.
 *
 * @param referenceId - The id of the reference.
 * @param channel - The channel, from 1, or null for the mix.
 * @returns The URL.
 */
export function getReferenceAudioUrl(referenceId: string, channel: number | null): string {
  const folder = `/media/references/${encodeURIComponent(referenceId)}`;
  return channel === null
    ? `${folder}/audio.flac`
    : `${folder}/channels/${String(channel).padStart(2, '0')}.flac`;
}

/** The player store. */
export const usePlayerStore = create<PlayerStore>()((set, get) => {
  /**
   * Plays stretches of audio from a second, round a loop if given, once what is playing is set.
   *
   * @param stretches - What plays, each a stretch of an audio file.
   * @param getUrl - Gives a stretch's file from its clipId.
   * @param from - Where play starts, in seconds.
   * @param loop - The loop it plays round, or null.
   */
  async function play(
    stretches: Stretch[],
    getUrl: (clipId: string) => string,
    from: number,
    loop: Loop | null,
  ): Promise<void> {
    const { end } = get();
    try {
      const isStarted = await playStretches(
        stretches,
        getUrl,
        from,
        end,
        loop,
        (loaded) => set({ loaded }),
        () => set({ mode: 'stopped', from: 0 }),
      );
      if (isStarted) set({ mode: 'playing' });
    } catch (error) {
      set({ mode: 'stopped', error: error instanceof Error ? error.message : String(error) });
    }
  }

  return {
    song: null,
    reference: null,
    mode: 'stopped',
    loaded: 0,
    from: 0,
    end: 0,
    loop: null,
    error: null,
    playSong: async (song, from = 0, loop = null) => {
      const unlocking = unlockAudio();
      const stretches = getStretches(song.song, song.clips);
      const end = getEnd(stretches);
      const start = loop ? getLoopFrom(from, loop) : from >= end ? 0 : from;
      set({
        song,
        reference: null,
        mode: 'loading',
        loaded: 0,
        from: start,
        end,
        loop,
        error: null,
      });
      await unlocking;
      await play(stretches, getClipAudioUrl, start, loop);
    },
    playReference: async (reference, from = 0) => {
      const unlocking = unlockAudio();
      const end = reference.seconds;
      const start = from >= end ? 0 : from;
      const stretch = {
        clipId: reference.url,
        trackId: REFERENCE_TRACK,
        start: 0,
        offset: 0,
        duration: end,
      };
      set({ song: null, reference, mode: 'loading', loaded: 0, from: start, end, loop: null });
      set({ error: null });
      await unlocking;
      await play([stretch], (url) => url, start, null);
    },
    stopSong: (at) => {
      stopPlaying();
      set({ mode: 'stopped', from: at });
    },
    seekSong: (to) => {
      const { song, reference, mode, loop, playSong, playReference } = get();
      if (song && mode !== 'stopped') void playSong(song, to, loop);
      else if (reference && mode !== 'stopped') void playReference(reference, to);
      else set({ from: to });
    },
  };
});
