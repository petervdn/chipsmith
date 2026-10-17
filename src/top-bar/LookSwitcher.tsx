// The moon / the sun in the top bar: switches the page between light and dark.
import { Moon, Sun } from 'lucide-react';
import { useLook } from './use-look.ts';
import './LookSwitcher.css';

/**
 * Shows the switch between the light and the dark look.
 *
 * @returns The switch's button element.
 */
export function LookSwitcher() {
  const { look, showNextLook } = useLook();
  const isDark = look.id === 'dark';
  return (
    <button
      type="button"
      className="look-switcher"
      onClick={showNextLook}
      data-tooltip={isDark ? 'switch to light' : 'switch to dark'}
      aria-label={isDark ? 'switch to light' : 'switch to dark'}
    >
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}
