/**
 * Clearing what this browser keeps of the page (the persisted store: preferences-store.ts), put back
 * as a first visit has it. Knows nothing of where it is asked.
 */
import { usePreferencesStore } from './preferences-store.ts';

/** Puts every persisted store back as a first visit has it, in this browser and in its storage. */
export function clearSavedSettings(): void {
  usePreferencesStore.getState().reset();
}
