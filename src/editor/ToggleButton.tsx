// A switch in the editor bar: a button with a checkbox left of its label, ticked while it is on. It
// knows nothing of what it switches.
import { Check } from 'lucide-react';
import './ToggleButton.css';

type ToggleButtonProps = { label: string; isOn: boolean; onToggle: () => void; tooltip: string };

/**
 * Shows a switch as a button with a checkbox.
 *
 * @param props - The component's props.
 * @param props.label - What it switches, in a word.
 * @param props.isOn - Whether it is on.
 * @param props.onToggle - Called to switch it.
 * @param props.tooltip - What it does, shown when the pointer rests on it.
 * @returns The button's element.
 */
export function ToggleButton({ label, isOn, onToggle, tooltip }: ToggleButtonProps) {
  return (
    <button
      type="button"
      className={`toggle-button${isOn ? ' is-on' : ''}`}
      onClick={onToggle}
      aria-pressed={isOn}
      data-tooltip={tooltip}
    >
      <span className="toggle-button-box" aria-hidden="true">
        {isOn && <Check />}
      </span>
      {label}
    </button>
  );
}
