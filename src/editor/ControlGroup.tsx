// A group of the editor's controls under a very small label over a thin line as wide as the group.
// It knows nothing of what the controls do.
import type { ReactNode } from 'react';
import './ControlGroup.css';

type ControlGroupProps = { label: string; children: ReactNode };

/**
 * Shows controls together under their label.
 *
 * @param props - The component's props.
 * @param props.label - What the controls are for, in a word or two.
 * @param props.children - The controls.
 * @returns The group's element.
 */
export function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <div className="control-group" role="group" aria-label={label}>
      <span className="control-group-label" aria-hidden="true">
        {label}
      </span>
      <div className="control-group-controls">{children}</div>
    </div>
  );
}
