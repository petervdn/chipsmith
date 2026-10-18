// The look's switch in the top bar: the look's name between a step back and a step on.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLook } from './use-look.ts';
import './LookSwitcher.css';

/**
 * Shows the switch between the looks.
 *
 * @returns The switch's element.
 */
export function LookSwitcher() {
  const { look, showNextLook, showPreviousLook } = useLook();
  return (
    <div className="look-switcher">
      <button
        type="button"
        className="look-switcher-step"
        onClick={showPreviousLook}
        data-tooltip="the look before"
        aria-label="the look before"
      >
        <ChevronLeft />
      </button>
      <span className="look-switcher-name">{look.name}</span>
      <button
        type="button"
        className="look-switcher-step"
        onClick={showNextLook}
        data-tooltip="the next look"
        aria-label="the next look"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
