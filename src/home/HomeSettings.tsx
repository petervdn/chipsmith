// What this browser keeps of the page, on the home page: a line saying what it is, and a quiet
// button that clears it at once (use-clear-settings.ts); what it clears is too small to ask. For a
// moment after, the button says ✓ Cleared.
import { Check } from 'lucide-react';
import { useClearSettings } from './use-clear-settings.ts';
import './HomeSettings.css';

/**
 * Shows what this browser keeps, and the button that clears it.
 *
 * @returns The settings' element.
 */
export function HomeSettings() {
  const { isCleared, clear } = useClearSettings();
  return (
    <div className="home-settings">
      <p className="home-page-note">
        This browser keeps light or dark mode, the volume and mute, and the editor’s sizes and
        switches. This does not affect saved songs or clips.
      </p>
      <button type="button" className="home-settings-clear" onClick={clear}>
        {isCleared ? (
          <>
            <Check /> Cleared
          </>
        ) : (
          'Clear saved settings'
        )}
      </button>
    </div>
  );
}
