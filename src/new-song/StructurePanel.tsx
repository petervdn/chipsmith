// The Structure panel on New: always the chosen structure, named, and as tiles as wide as their bars,
// coloured by part, with ▸ at its right; ▸ (or a tap on a tile) opens under them the choices (none,
// a preset, a saved structure or your own, as chips), the structure written short (editable), the
// selected section's editor, and saving it, as new or over the saved one, or deleting a saved one;
// the tiles stay where they are.
import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  getRelation,
  getSectionName,
  keepDetails,
  readNotation,
  writeNotation,
} from '../../shared/structure-notation.ts';
import { getTrackColor } from '../editor/timeline.ts';
import { SectionEditor } from './SectionEditor.tsx';
import {
  addSection,
  changeSection,
  duplicateSection,
  moveSection,
  removeSection,
} from './structure-edits.ts';
import type { useStructureChoice } from './use-structure-choice.ts';
import './StructurePanel.css';
import { askToConfirm } from '../stores/confirm-store.ts';

type StructurePanelProps = { choice: ReturnType<typeof useStructureChoice> };

/**
 * Shows the Structure panel: the chosen structure, and under it while open what changes it.
 *
 * @param props - The component's props.
 * @param props.choice - The structure chosen for the prompt, and what changes it.
 * @returns The panel's section element.
 */
export function StructurePanel({ choice }: StructurePanelProps) {
  const [notationError, setNotationError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isOpen, setOpen] = useState(false);
  const { source, sections, selected, saved, presets } = choice;
  function isChosen(kind: string, id: string | null): boolean {
    return source.kind === kind && (id === null || ('id' in source && source.id === id));
  }
  return (
    <section className={`structure-panel${isOpen ? ' is-open' : ''}`}>
      <div className="structure-panel-top">
        <div className="structure-panel-summary">
          <span className="structure-panel-heading">
            structure · {getSummary({ kind: source.kind, name: choice.name, sections })}
          </span>
          {source.kind === 'none' ? (
            <p className="structure-panel-none">None: Claude chooses the form.</p>
          ) : (
            <div className="structure-panel-tiles">
              {sections.map((section, i) => {
                const relation = getRelation(sections, i);
                const style: CSSProperties & Record<'--tile-color', string> = {
                  flexGrow: section.bars,
                  '--tile-color': getTrackColor(section.letter.charCodeAt(0) - 65),
                };
                return (
                  <button
                    key={i}
                    type="button"
                    className={`structure-panel-tile is-${relation}${selected === i ? ' is-selected' : ''}`}
                    style={style}
                    onClick={() => {
                      choice.select(selected === i ? null : i);
                      setOpen(true);
                    }}
                    data-tooltip={`${getSectionName(section)}: ${relation}, ${section.bars} bars`}
                  >
                    <span className="structure-panel-tile-name">{getSectionName(section)}</span>
                    <span className="structure-panel-tile-bars">
                      {section.bars}
                      {section.role ? ` · ${section.role}` : ''}
                    </span>
                  </button>
                );
              })}
              {isOpen && (
                <button
                  type="button"
                  className="structure-panel-add"
                  onClick={() => choice.edit(addSection)}
                  data-tooltip="add a new part at the end"
                  aria-label="add a new part at the end"
                >
                  <Plus />
                </button>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="structure-panel-toggle"
          onClick={() => setOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'hide the structure choices' : 'change the structure'}
          data-tooltip={
            isOpen
              ? 'hide the structure choices'
              : 'change the structure: pick one, edit it, save it'
          }
        >
          <ChevronRight />
        </button>
      </div>
      {isOpen && (
        <div className="structure-panel-body">
          <p className="structure-panel-help">
            The form of the songs, optional: a letter is a part, ′ a variation of it, the same
            letter again a repeat.
          </p>
          <div className="structure-panel-choices">
            <button
              type="button"
              className={`list-chip${isChosen('none', null) ? ' is-on' : ''}`}
              onClick={() => choice.choose({ kind: 'none' })}
            >
              None
            </button>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`list-chip${isChosen('preset', preset.id) ? ' is-on' : ''}`}
                onClick={() => choice.choose({ kind: 'preset', id: preset.id })}
                data-tooltip={writeNotation(preset.sections)}
              >
                {preset.name}
              </button>
            ))}
            {saved.map((structure) => (
              <button
                key={structure.id}
                type="button"
                className={`list-chip is-saved${isChosen('saved', structure.id) ? ' is-on' : ''}`}
                onClick={() => choice.choose({ kind: 'saved', id: structure.id })}
                data-tooltip={writeNotation(structure.sections)}
              >
                {structure.name}
              </button>
            ))}
            <button
              type="button"
              className={`list-chip${isChosen('own', null) ? ' is-on' : ''}`}
              onClick={() => choice.choose({ kind: 'own' })}
            >
              <Plus /> Your own
            </button>
          </div>
          {source.kind !== 'none' && (
            <>
              <input
                key={writeNotation(sections)}
                className="structure-panel-notation"
                defaultValue={writeNotation(sections)}
                aria-label="the structure written short"
                spellCheck={false}
                onBlur={(event) => {
                  const read = readNotation(event.target.value);
                  setNotationError(read.error);
                  if (read.sections) {
                    const next = keepDetails(read.sections, sections);
                    if (writeNotation(next) !== writeNotation(sections)) choice.edit(() => next);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                }}
              />
              {notationError && <p className="error">{notationError}</p>}
              {selected !== null && (
                <SectionEditor
                  sections={sections}
                  index={selected}
                  onChange={(change) =>
                    choice.edit((current) => changeSection(current, selected, change))
                  }
                  onMove={(step) => {
                    choice.edit((current) => moveSection(current, selected, step));
                    choice.select(Math.min(sections.length - 1, Math.max(0, selected + step)));
                  }}
                  onCopy={() => {
                    choice.edit((current) => duplicateSection(current, selected));
                    choice.select(selected + 1);
                  }}
                  onRemove={() => {
                    choice.edit((current) => removeSection(current, selected));
                    choice.select(null);
                  }}
                />
              )}
              <div className="structure-panel-save">
                {source.kind === 'saved' && choice.isEdited && (
                  <button
                    type="button"
                    onClick={() => choice.save(null)}
                    disabled={choice.isSaving}
                  >
                    Save over "{choice.name}"
                  </button>
                )}
                <input
                  className="structure-panel-name"
                  value={newName}
                  placeholder="name"
                  aria-label="name to save it under"
                  onChange={(event) => setNewName(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    choice.save(newName.trim());
                    setNewName('');
                  }}
                  disabled={!newName.trim() || choice.isSaving}
                >
                  Save as new
                </button>
                {source.kind === 'saved' && (
                  <button
                    type="button"
                    className="structure-panel-delete"
                    onClick={async () => {
                      const question = `Delete the structure "${choice.name}"?`;
                      if (await askToConfirm({ question, answer: 'Delete', isDanger: true })) {
                        choice.remove();
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              {choice.saveError && <p className="error">{choice.saveError.message}</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Returns the chosen structure in a few words: its name and length.
 *
 * @param chosen - The structure chosen.
 * @param chosen.kind - Where it came from: none, a preset, a saved one, or your own.
 * @param chosen.name - Its name; empty for your own.
 * @param chosen.sections - Its sections.
 * @returns "none", or "AABA (32 bars) · 4 sections, 32 bars".
 */
function getSummary({
  kind,
  name,
  sections,
}: {
  kind: string;
  name: string;
  sections: { bars: number }[];
}): string {
  if (kind === 'none') return 'none';
  const bars = sections.reduce((sum, section) => sum + section.bars, 0);
  return `${name || 'your own'} · ${sections.length} sections, ${bars} bars`;
}
