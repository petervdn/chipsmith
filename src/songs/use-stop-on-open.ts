// A song's page opens with only that song playing, if anything: another song stops,
// and the editor starts from its start; the song itself, already playing (from a list's ▶), plays on
// and the editor shows it where it is, so its transport is the one that plays (docs/adr/0045).
import { useEffect } from 'react';
import { usePlayerStore } from '../stores/player-store.ts';

/**
 * Stops what the player plays when the page opens, unless it is the song the page opens.
 *
 * @param songId - The id of the song the page opens.
 */
export function useStopOnOpen(songId: string): void {
  useEffect(() => {
    const { mode, song, stopSong } = usePlayerStore.getState();
    const isThisSong = song?.song.id === songId;
    if (mode !== 'stopped' && !isThisSong) stopSong(0);
  }, [songId]);
}
