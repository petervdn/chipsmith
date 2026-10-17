// ☾ / ☀ in the top bar: switches the page between light and dark.
import { useLook } from './use-look.ts';
import './LookSwitcher.css';

/** The light / dark switch. */
export function LookSwitcher() {
  const { look, showNextLook } = useLook();
  const isDark = look.id === 'dark';
  return (
    <button
      type="button"
      className="look-switcher"
      onClick={showNextLook}
      title={isDark ? 'switch to light' : 'switch to dark'}
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}
