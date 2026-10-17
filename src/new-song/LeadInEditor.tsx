// How one section leads into the next, to choose: the lead-ins by what plays them (drums, bass,
// harmony, lead, all together) as switches, any number or none for Claude's choice; a die picks one
// or two at random.
import { Dices } from 'lucide-react';
import { LEAD_IN_GROUPS, LEAD_INS } from '../../shared/lead-ins.ts';
import '../lists/lists.css';
import './LeadInEditor.css';

type LeadInEditorProps = {
  name: string;
  leadIn: string[];
  onToggle: (value: string) => void;
  onRoll: () => void;
  onClear: () => void;
};

/**
 * Shows a gap's lead-ins as switches, by what plays them.
 *
 * @param props - The component's props.
 * @param props.name - The gap, like `A′ → B`.
 * @param props.leadIn - The lead-ins chosen.
 * @param props.onToggle - Called with a lead-in switched on or off.
 * @param props.onRoll - Called to pick the lead-ins at random.
 * @param props.onClear - Called to leave it to Claude.
 * @returns The editor's element.
 */
export function LeadInEditor({ name, leadIn, onToggle, onRoll, onClear }: LeadInEditorProps) {
  return (
    <div className="lead-in-editor">
      <div className="lead-in-editor-head">
        <span className="lead-in-editor-name">{name}</span>
        <span className="lead-in-editor-hint">
          {leadIn.length > 0
            ? 'played at the end of the section before'
            : "none chosen: Claude's choice"}
        </span>
        <button
          type="button"
          className="lead-in-editor-button"
          onClick={onRoll}
          data-tooltip="pick one or two at random"
          aria-label="pick one or two at random"
        >
          <Dices />
        </button>
        {leadIn.length > 0 && (
          <button type="button" className="lead-in-editor-button" onClick={onClear}>
            clear
          </button>
        )}
      </div>
      {LEAD_IN_GROUPS.map(({ group, label }) => (
        <div key={group} className="lead-in-editor-row">
          <span className="lead-in-editor-label">{label}</span>
          <span className="lead-in-editor-chips">
            {LEAD_INS.filter((candidate) => candidate.group === group).map((candidate) => (
              <button
                key={candidate.value}
                type="button"
                className={`list-chip${leadIn.includes(candidate.value) ? ' is-on' : ''}`}
                onClick={() => onToggle(candidate.value)}
                aria-pressed={leadIn.includes(candidate.value)}
                data-tooltip={candidate.ask}
              >
                {candidate.label}
              </button>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
