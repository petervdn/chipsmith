// A song's page opens with nothing playing: whatever played, from another page or the song itself,
// stops, and the editor starts from its start, so its transport is the one that plays.
import { useEffect } from 'react';
import { usePlayerStore } from '../stores/player-store.ts';

/** Stops what the player plays when the page opens. */
export function useStopOnOpen(): void {
  useEffect(() => {
    const { mode, stopSong } = usePlayerStore.getState();
    if (mode !== 'stopped') stopSong(0);
  }, []);
}
