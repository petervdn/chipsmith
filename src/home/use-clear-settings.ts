// Clearing the saved settings from Home's button, and whether that was just done, for the button
// to say so for a moment. It knows nothing of how the button looks.
import { useEffect, useState } from 'react';
import { clearSavedSettings } from '../stores/saved-settings.ts';

/** Milliseconds the button says it cleared, before it reads as before. */
const CLEARED_SHOWN = 2000;

/**
 * Gives the handler that clears the saved settings, and whether it just did.
 *
 * @returns Whether the settings were cleared a moment ago, and the handler that clears them.
 */
export function useClearSettings() {
  const [isCleared, setCleared] = useState(false);
  useEffect(() => {
    if (!isCleared) return;
    const timer = setTimeout(() => setCleared(false), CLEARED_SHOWN);
    return () => clearTimeout(timer);
  }, [isCleared]);
  return {
    isCleared,
    clear: () => {
      clearSavedSettings();
      setCleared(true);
    },
  };
}
