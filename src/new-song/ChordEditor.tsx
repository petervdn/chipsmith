// The selected chord of a part's progression, to change: its numeral (one of the mode's own chords,
// or any typed), its length in bars; and to move, copy or remove it.
import { ArrowLeft, ArrowRight, Copy, Trash2 } from 'lucide-react';
import { getChordName, normalizeNumeral } from '../../shared/chord-numerals.ts';
import type { Chord } from '../../shared/harmony.types.ts';
import { writeBars } from '../../shared/progression-notation.ts';
import { CHORD_LENGTHS } from './progression-edits.ts';
import './ChordEditor.css';

type ChordEditorProps = {
  chord: Chord;
  ownChords: string[];
  note: string | null;
  canRemove: boolean;
  onChange: (change: Partial<Chord>) => void;
  onMove: (step: number) => void;
  onCopy: () => void;
  onRemove: () => void;
};

/**
 * Shows the selected chord's numeral and length, and its actions.
 *
 * @param props - The component's props.
 * @param props.chord - The chord.
 * @param props.ownChords - The mode's own chords, offered as switches.
 * @param props.note - The key's note, to name the chords in, or null.
 * @param props.canRemove - Whether it can be removed (not the only chord).
 * @param props.onChange - Called with its numeral or length changed.
 * @param props.onMove - Called with -1 to move it earlier, 1 later.
 * @param props.onCopy - Called to place a copy right after it.
 * @param props.onRemove - Called to remove it.
 * @returns The editor's element.
 */
export function ChordEditor({
  chord,
  ownChords,
  note,
  canRemove,
  onChange,
  onMove,
  onCopy,
  onRemove,
}: ChordEditorProps) {
  return (
    <div className="chord-editor">
      <div className="chord-editor-row">
        <span className="chord-editor-label">Chord</span>
        {ownChords.map((numeral) => (
          <button
            key={numeral}
            type="button"
            className={`list-chip${numeral === chord.numeral ? ' is-on' : ''}`}
            onClick={() => onChange({ numeral })}
            data-tooltip={note ? (getChordName(numeral, note) ?? numeral) : 'a chord of the mode'}
          >
            {numeral}
          </button>
        ))}
        <input
          key={chord.numeral}
          className="chord-editor-numeral"
          defaultValue={chord.numeral}
          aria-label="the chord as a numeral, any: ♭VI, V7, iiø7, IV5"
          data-tooltip="any chord as a numeral: ♭VI, V7, iiø7, IV5, Vsus4"
          spellCheck={false}
          onBlur={(event) => {
            const numeral = normalizeNumeral(event.target.value);
            if (numeral && numeral !== chord.numeral) onChange({ numeral });
            else event.target.value = chord.numeral;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <div className="chord-editor-row">
        <span className="chord-editor-label">Bars</span>
        {CHORD_LENGTHS.map((bars) => (
          <button
            key={bars}
            type="button"
            className={`list-chip${bars === chord.bars ? ' is-on' : ''}`}
            onClick={() => onChange({ bars })}
          >
            {writeBars(bars)}
          </button>
        ))}
        <span className="chord-editor-actions">
          <button
            type="button"
            onClick={() => onMove(-1)}
            data-tooltip="move it earlier"
            aria-label="move it earlier"
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            data-tooltip="move it later"
            aria-label="move it later"
          >
            <ArrowRight />
          </button>
          <button
            type="button"
            onClick={onCopy}
            data-tooltip="copy it after itself"
            aria-label="copy it after itself"
          >
            <Copy />
          </button>
          <button
            type="button"
            className="chord-editor-remove"
            onClick={onRemove}
            disabled={!canRemove}
            data-tooltip="remove it"
            aria-label="remove it"
          >
            <Trash2 />
          </button>
        </span>
      </div>
    </div>
  );
}
