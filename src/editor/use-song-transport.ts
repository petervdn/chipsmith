// Playing an opened song from its cursor: ▶ plays from there, ❚❚ pauses where it is and ▶ plays on
// from there, ■ stops and goes back to the cursor, and ■ again goes back to the start. A new place plays on from there while playing, or
// moves the cursor (and forgets a pause) while not. With a loop it plays round it. An edit, or a
// change of the loop, made while it plays is heard at once: it plays on, as changed, from where it is.
import { useEffect, useRef, useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { getSongPosition } from '../playback/audio-engine.ts';
import { getEnd, getStretches } from '../playback/schedule.ts';
import type { Loop } from '../playback/loop.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Plays an opened song from its cursor, pauses and stops it, and keeps the cursor.
 *
 * @param detail - The opened song, with its clips.
 * @param loop - The loop to play round, or null to play to the end.
 * @returns Where the playhead stands while not playing (`cursor`, in seconds: where it paused, or
 * the cursor); the song's mode (stopped, loading or playing; stopped while another song plays);
 * `isPaused`; `canStop`, whether ■ has anything to do (it plays, is paused, or the cursor is not at
 * the start); `togglePlaying`, which plays from the pause or the cursor, or pauses; `stop`, which
 * stops and goes back to the cursor, or, stopped there already, goes back to the start; `end`, the
 * song's length in seconds; `moveTo`, which moves the cursor to a second and plays on from
 * there if the song plays; and `playFrom`, which moves the cursor to a second and plays from there.
 */
export function useSongTransport(detail: SongDetail, loop: Loop | null) {
  const [cursor, setCursor] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const mode = usePlayerStore((state) =>
    state.song?.song.id === detail.song.id ? state.mode : 'stopped',
  );
  const playSong = usePlayerStore((state) => state.playSong);
  const stopSong = usePlayerStore((state) => state.stopSong);
  const isPaused = mode === 'stopped' && pausedAt !== null;
  // what is played, not how loud: a fader moved while playing is heard through the track's gain
  const tracksKey = JSON.stringify([
    detail.song.tracks.map(({ id, blocks }) => ({ id, blocks })),
    loop,
  ]);
  const playedKeyRef = useRef(tracksKey);
  useEffect(() => {
    if (tracksKey === playedKeyRef.current) return;
    playedKeyRef.current = tracksKey;
    const position = getSongPosition();
    if (mode === 'playing' && position !== null) void playSong(detail, position, loop);
  });
  function pause(): void {
    const position = getSongPosition() ?? cursor;
    stopSong(position);
    setPausedAt(position);
  }
  function stop(): void {
    if (mode === 'stopped' && pausedAt === null) setCursor(0);
    if (mode !== 'stopped') stopSong(cursor);
    setPausedAt(null);
  }
  function togglePlaying(): void {
    if (mode !== 'stopped') {
      pause();
      return;
    }
    setPausedAt(null);
    void playSong(detail, pausedAt ?? cursor, loop);
  }
  function moveTo(seconds: number): void {
    setCursor(seconds);
    setPausedAt(null);
    if (mode !== 'stopped') void playSong(detail, seconds, loop);
  }
  function playFrom(seconds: number): void {
    setCursor(seconds);
    setPausedAt(null);
    void playSong(detail, seconds, loop);
  }
  return {
    cursor: mode === 'stopped' && pausedAt !== null ? pausedAt : cursor,
    mode,
    isPaused,
    canStop: mode !== 'stopped' || pausedAt !== null || cursor > 0,
    togglePlaying,
    stop,
    end: getEnd(getStretches(detail.song, detail.clips)),
    moveTo,
    playFrom,
  };
}
