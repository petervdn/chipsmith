/**
 * Clearing what this browser keeps of the page (the persisted stores: preferences-store.ts and
 * new-song-store.ts), each put back as a first visit has it. Knows nothing of where it is asked.
 */
import { useNewSongStore } from './new-song-store.ts';
import { usePreferencesStore } from './preferences-store.ts';

/** Puts every persisted store back as a first visit has it, in this browser and in its storage. */
export function clearSavedSettings(): void {
  usePreferencesStore.getState().reset();
  useNewSongStore.getState().reset();
}
