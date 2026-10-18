// What this browser keeps of the page, on the home page: a line saying what it is, and a quiet
// button that clears it at once (stores/saved-settings.ts); what it clears is too small to ask.
import { clearSavedSettings } from '../stores/saved-settings.ts';
import './HomeSettings.css';

/**
 * Shows what this browser keeps, and the button that clears it.
 *
 * @returns The settings' element.
 */
export function HomeSettings() {
  return (
    <div className="home-settings">
      <p className="home-page-note">
        This browser keeps light or dark mode, the volume and mute, the editor’s sizes and switches,
        and what the New Song page was left at. This does not affect saved songs or clips.
      </p>
      <button type="button" className="home-settings-clear" onClick={clearSavedSettings}>
        Clear saved settings
      </button>
    </div>
  );
}
