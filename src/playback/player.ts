/**
 * The one player of the page: which song plays, whether it is loading, playing or stopped, and where
 * it is. Pages and the player bar read it with `usePlayer` and change it with the functions below;
 * the audio itself is audio-engine.ts's.
 */
import { useSyncExternalStore } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { getEnd, getStretches } from './schedule.ts';
import { playStretches, stopPlaying, unlockAudio } from './audio-engine.ts';

/** What the player is doing. */
export type PlayerState = {
  song: SongDetail | null;
  mode: 'stopped' | 'loading' | 'playing';
  /** How much of the song's audio has loaded, 0 to 1, while loading. */
  loaded: number;
  /** Where play starts or started, in seconds. */
  from: number;
  /** The song's length in seconds. */
  end: number;
  error: string | null;
};

let state: PlayerState = { song: null, mode: 'stopped', loaded: 0, from: 0, end: 0, error: null };
const listeners = new Set<() => void>();

/** The player's state, kept current in a component. */
export function usePlayer(): PlayerState {
  return useSyncExternalStore(subscribe, getState);
}

/** The URL of a clip's audio. */
export function getClipAudioUrl(clipId: string): string {
  return `/media/clips/${encodeURIComponent(clipId)}/audio.flac`;
}

/** Plays a song from a second; call it from a tap. */
export async function playSong(song: SongDetail, from = 0): Promise<void> {
  const unlocking = unlockAudio();
  const stretches = getStretches(song.song, song.clips);
  const end = getEnd(stretches);
  const start = from >= end ? 0 : from;
  setState({ song, mode: 'loading', loaded: 0, from: start, end, error: null });
  await unlocking;
  try {
    const isStarted = await playStretches(
      stretches,
      getClipAudioUrl,
      start,
      end,
      (loaded) => setState({ ...state, loaded }),
      () => setState({ ...state, mode: 'stopped', from: 0 }),
    );
    if (isStarted) setState({ ...state, mode: 'playing' });
  } catch (error) {
    setState({
      ...state,
      mode: 'stopped',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Stops, keeping the place it stopped at. */
export function stopSong(from: number): void {
  stopPlaying();
  setState({ ...state, mode: 'stopped', from });
}

/** Moves to a second of the song, playing on from there if it was playing. */
export function seekSong(to: number): void {
  if (state.song && state.mode !== 'stopped') void playSong(state.song, to);
  else setState({ ...state, from: to });
}

function getState(): PlayerState {
  return state;
}

function setState(next: PlayerState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
