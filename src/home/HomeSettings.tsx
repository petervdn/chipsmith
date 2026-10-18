// What this browser keeps of the page, on the home page: a line saying what it is, and a quiet
// button that clears it after asking (stores/saved-settings.ts).
import { askToConfirm } from '../stores/confirm-store.ts';
import { clearSavedSettings } from '../stores/saved-settings.ts';
import './HomeSettings.css';

/**
 * Shows what this browser keeps, and the button that clears it.
 *
 * @returns The settings' element.
 */
export function HomeSettings() {
  async function clear(): Promise<void> {
    const isYes = await askToConfirm({
      question:
        'Clear the settings this browser keeps? Light or dark mode, the volume and mute, the editor’s sizes and switches, and New’s choices go back to how they start. Songs, clips and guides stay.',
      answer: 'Clear',
    });
    if (isYes) clearSavedSettings();
  }
  return (
    <div className="home-settings">
      <p className="home-page-note">
        This browser keeps light or dark mode, the volume and mute, the editor’s sizes and switches,
        and what New was left at.
      </p>
      <button type="button" className="home-settings-clear" onClick={() => void clear()}>
        Clear saved settings
      </button>
    </div>
  );
}
