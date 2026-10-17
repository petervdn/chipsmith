// The selected section of a structure, to change: which part it is (any part or variant in the
// structure, the next variation of one, or a new part), its bars, role, energy and note; and to move,
// copy or remove it.
import { getSectionName } from '../../shared/structure-notation.ts';
import type { Section } from '../../shared/structure.types.ts';
import { SECTION_ROLES, getPartChoices } from './structure-edits.ts';
import './SectionEditor.css';

type SectionEditorProps = {
  sections: Section[];
  index: number;
  onChange: (change: Partial<Section>) => void;
  onMove: (step: number) => void;
  onCopy: () => void;
  onRemove: () => void;
};

/** The energies offered, besides none. */
const ENERGIES = [1, 2, 3, 4, 5];

/**
 * Shows the selected section's fields and actions.
 *
 * @param props - The component's props.
 * @param props.sections - The structure's sections.
 * @param props.index - The selected section's place among them.
 * @param props.onChange - Called with the fields changed.
 * @param props.onMove - Called with -1 to move it earlier, 1 later.
 * @param props.onCopy - Called to place a copy right after it.
 * @param props.onRemove - Called to remove it.
 * @returns The editor's element, or null when no section is at `index`.
 */
export function SectionEditor({
  sections,
  index,
  onChange,
  onMove,
  onCopy,
  onRemove,
}: SectionEditorProps) {
  const section = sections[index];
  if (!section) return null;
  const choices = getPartChoices(sections);
  return (
    <div className="section-editor">
      <label className="section-editor-field">
        <span>Part</span>
        <select
          value={`${section.letter}${section.variant}`}
          onChange={(event) => {
            const choice = choices.find(
              ({ letter, variant }) => `${letter}${variant}` === event.target.value,
            );
            if (choice) onChange({ letter: choice.letter, variant: choice.variant });
          }}
        >
          {choices.map((choice, i) => (
            <option
              key={`${choice.letter}${choice.variant}`}
              value={`${choice.letter}${choice.variant}`}
            >
              {i === choices.length - 1
                ? `${choice.letter}: a new part`
                : `${getSectionName(choice)}${choice.variant > 0 ? ` (variation of ${choice.letter})` : ''}`}
            </option>
          ))}
        </select>
      </label>
      <label className="section-editor-field">
        <span>Bars</span>
        <input
          type="number"
          min={1}
          max={256}
          value={section.bars}
          onChange={(event) => {
            const bars = Math.round(Number(event.target.value));
            if (bars >= 1 && bars <= 256) onChange({ bars });
          }}
        />
      </label>
      <label className="section-editor-field">
        <span>Role</span>
        <select
          value={section.role ?? ''}
          onChange={(event) => onChange({ role: event.target.value || null })}
        >
          <option value="">none</option>
          {[...new Set([...SECTION_ROLES, section.role ?? ''])].filter(Boolean).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>
      <label className="section-editor-field">
        <span>Energy</span>
        <select
          value={section.energy ?? ''}
          onChange={(event) =>
            onChange({ energy: event.target.value ? Number(event.target.value) : null })
          }
        >
          <option value="">–</option>
          {ENERGIES.map((energy) => (
            <option key={energy} value={energy}>
              {energy}
            </option>
          ))}
        </select>
      </label>
      <label className="section-editor-field section-editor-note">
        <span>Note</span>
        <input
          value={section.note}
          placeholder="e.g. only triangle and noise"
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </label>
      <div className="section-editor-actions">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          data-tooltip="move earlier"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === sections.length - 1}
          data-tooltip="move later"
        >
          →
        </button>
        <button type="button" onClick={onCopy} data-tooltip="the same part again, right after">
          Copy
        </button>
        <button type="button" className="section-editor-remove" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
