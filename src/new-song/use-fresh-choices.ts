// New's choices started afresh when the page is left, so every visit to New starts as the first
// (docs/adr/0052). Knows nothing of what the choices are.
import { useEffect } from 'react';
import { useNewSongStore } from '../stores/new-song-store.ts';

/** Starts New's choices afresh when the page that calls it goes. */
export function useFreshChoices() {
  useEffect(() => () => useNewSongStore.getState().reset(), []);
}
