// Playing an opened song from its cursor: ▶ plays from there, ■ stops and leaves the cursor where it
// stopped, and a new place plays on from there while playing or moves the cursor while stopped.
import { useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/** The cursor, whether this song is loading or playing, and how to play, stop and move. */
export function useSongTransport(detail: SongDetail) {
  const [cursor, setCursor] = useState(0);
  const mode = usePlayerStore((state) =>
    state.song?.song.id === detail.song.id ? state.mode : 'stopped',
  );
  const playSong = usePlayerStore((state) => state.playSong);
  const stopSong = usePlayerStore((state) => state.stopSong);
  function togglePlaying(): void {
    if (mode === 'stopped') {
      void playSong(detail, cursor);
      return;
    }
    const position = getSongPosition() ?? cursor;
    stopSong(position);
    setCursor(position);
  }
  function moveTo(seconds: number): void {
    setCursor(seconds);
    if (mode !== 'stopped') void playSong(detail, seconds);
  }
  function playFrom(seconds: number): void {
    setCursor(seconds);
    void playSong(detail, seconds);
  }
  return { cursor, mode, togglePlaying, moveTo, playFrom };
}
