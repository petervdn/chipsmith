// ‹ name › in the top bar: the looks of the page, one after another, to compare them.
import { useLook } from './use-look.ts';

/** The look switcher. */
export function LookSwitcher() {
  const { look, showPreviousLook, showNextLook } = useLook();
  return (
    <div className="look-switcher">
      <button type="button" onClick={showPreviousLook} title="the look before">
        ‹
      </button>
      <span className="look-name">{look.name}</span>
      <button type="button" onClick={showNextLook} title="the next look">
        ›
      </button>
    </div>
  );
}
