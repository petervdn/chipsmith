// Playing an opened song from its cursor: ▶ plays from there, ❚❚ pauses where it is and ▶ plays on
// from there, ■ stops and goes back to the cursor. A new place plays on from there while playing, or
// moves the cursor (and forgets a pause) while not.
import { useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Plays an opened song from its cursor, pauses and stops it, and keeps the cursor.
 *
 * @param detail - The opened song, with its clips.
 * @returns Where the playhead stands while not playing (`cursor`, in seconds: where it paused, or
 * the cursor); the song's mode (stopped, loading or playing; stopped while another song plays);
 * `isPaused`; `togglePlaying`, which plays from the pause or the cursor, or pauses; `stop`, which
 * stops and goes back to the cursor; `moveTo`, which moves the cursor to a second and plays on from
 * there if the song plays; and `playFrom`, which moves the cursor to a second and plays from there.
 */
export function useSongTransport(detail: SongDetail) {
  const [cursor, setCursor] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const mode = usePlayerStore((state) =>
    state.song?.song.id === detail.song.id ? state.mode : 'stopped',
  );
  const playSong = usePlayerStore((state) => state.playSong);
  const stopSong = usePlayerStore((state) => state.stopSong);
  const isPaused = mode === 'stopped' && pausedAt !== null;
  function pause(): void {
    const position = getSongPosition() ?? cursor;
    stopSong(position);
    setPausedAt(position);
  }
  function stop(): void {
    if (mode !== 'stopped') stopSong(cursor);
    setPausedAt(null);
  }
  function togglePlaying(): void {
    if (mode !== 'stopped') {
      pause();
      return;
    }
    setPausedAt(null);
    void playSong(detail, pausedAt ?? cursor);
  }
  function moveTo(seconds: number): void {
    setCursor(seconds);
    setPausedAt(null);
    if (mode !== 'stopped') void playSong(detail, seconds);
  }
  function playFrom(seconds: number): void {
    setCursor(seconds);
    setPausedAt(null);
    void playSong(detail, seconds);
  }
  return {
    cursor: mode === 'stopped' && pausedAt !== null ? pausedAt : cursor,
    mode,
    isPaused,
    togglePlaying,
    stop,
    moveTo,
    playFrom,
  };
}
