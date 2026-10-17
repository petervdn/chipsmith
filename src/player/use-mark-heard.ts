// A song not heard yet becomes heard the moment it starts to play, so the lists can show which songs
// are still new.
import { useEffect, useRef } from 'react';
import { useSetSongStatus } from '../queries/songs.ts';
import { usePlayerStore } from '../stores/player-store.ts';

/** Marks the song playing as heard, once, when it was new. */
export function useMarkHeard(): void {
  const playing = usePlayerStore((state) => (state.mode === 'playing' ? state.song : null));
  const { mutate: setStatus } = useSetSongStatus();
  const markedRef = useRef(new Set<string>());
  useEffect(() => {
    if (!playing) return;
    const { id, status } = playing.song;
    if (status !== 'new' || markedRef.current.has(id)) return;
    markedRef.current.add(id);
    setStatus({ songId: id, status: 'heard' });
  }, [playing, setStatus]);
}
