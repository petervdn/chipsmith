// Playing an opened song from its cursor: ▶ plays from there, ■ stops and leaves the cursor where it
// stopped, and a new place plays on from there while playing or moves the cursor while stopped.
import { useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Plays an opened song from its cursor, and keeps the cursor.
 *
 * @param detail - The opened song, with its clips.
 * @returns The cursor, in seconds; the song's mode (stopped, loading or playing; stopped while
 * another song plays); `togglePlaying`, which plays from the cursor, or stops and leaves the cursor
 * where it stopped; `stop`, which stops it if it plays and leaves the cursor where it stopped;
 * `moveTo`, which moves the cursor to a second and plays on from there if the song
 * is not stopped; and `playFrom`, which moves the cursor to a second and plays from there.
 */
export function useSongTransport(detail: SongDetail) {
  const [cursor, setCursor] = useState(0);
  const mode = usePlayerStore((state) =>
    state.song?.song.id === detail.song.id ? state.mode : 'stopped',
  );
  const playSong = usePlayerStore((state) => state.playSong);
  const stopSong = usePlayerStore((state) => state.stopSong);
  function stop(): void {
    if (mode === 'stopped') return;
    const position = getSongPosition() ?? cursor;
    stopSong(position);
    setCursor(position);
  }
  function togglePlaying(): void {
    if (mode === 'stopped') void playSong(detail, cursor);
    else stop();
  }
  function moveTo(seconds: number): void {
    setCursor(seconds);
    if (mode !== 'stopped') void playSong(detail, seconds);
  }
  function playFrom(seconds: number): void {
    setCursor(seconds);
    void playSong(detail, seconds);
  }
  return { cursor, mode, togglePlaying, stop, moveTo, playFrom };
}
