// A part's progression in the Harmony panel: a row with its preset (or Claude's choice), a die and a
// lock; its chords as tiles as wide as their bars, the numeral over the chord's name in the key, a
// chord outside the mode marked; the tapped chord's editor; the progression written short; and,
// for a part the structure varies, how its variations end.
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { getChordName } from '../../shared/chord-numerals.ts';
import { VARIATION_ENDINGS } from '../../shared/harmony-settings.ts';
import type { VariationEnding } from '../../shared/harmony-settings.ts';
import type { Progression } from '../../shared/harmony.types.ts';
import type { Mode } from '../../shared/modes.ts';
import { getModeChords, isInMode } from '../../shared/modes.ts';
import { readProgression, writeBars, writeProgression } from '../../shared/progression-notation.ts';
import { getModePresets } from '../../shared/progression-presets.ts';
import { getTrackColor } from '../editor/timeline.ts';
import { ChordEditor } from './ChordEditor.tsx';
import { PartRow } from './PartRow.tsx';
import { changeChord, duplicateChord, moveChord, removeChord } from './progression-edits.ts';
import type { HarmonyPart as Part } from './random-harmony.ts';
import { getProgressionFit } from './random-harmony.ts';
import './HarmonyPart.css';

type HarmonyPartProps = {
  part: Part;
  progression: Progression | null;
  variation: VariationEnding;
  mode: Mode | null;
  note: string | null;
  isLocked: boolean;
  onRoll: () => void;
  onToggleLock: () => void;
  onChange: (progression: Progression | null) => void;
  onVariation: (ending: VariationEnding) => void;
};

/** What a progression changed by hand is named. */
const OWN_NAME = 'your own';
/** What the menu's choice of none is valued. */
const NO_PROGRESSION = '';
/** What the menu's choice of the progression as it is (rolled or your own) is valued. */
const AS_IT_IS = 'as-it-is';

/**
 * Shows a part's progression and what changes it.
 *
 * @param props - The component's props.
 * @param props.part - The part.
 * @param props.progression - Its progression, or null for Claude's choice.
 * @param props.variation - How its variations end.
 * @param props.mode - The key's mode, or null for Claude's choice.
 * @param props.note - The key's note, to name the chords in, or null.
 * @param props.isLocked - Whether Roll keeps its progression.
 * @param props.onRoll - Called when its die is pressed.
 * @param props.onToggleLock - Called when its lock is pressed.
 * @param props.onChange - Called with its progression changed, or null for Claude's choice.
 * @param props.onVariation - Called with how its variations end.
 * @returns The part's element.
 */
export function HarmonyPart({
  part,
  progression,
  variation,
  mode,
  note,
  isLocked,
  onRoll,
  onToggleLock,
  onChange,
  onVariation,
}: HarmonyPartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [notationError, setNotationError] = useState<string | null>(null);
  const presets = getModePresets(mode?.name ?? null);
  const preset = presets.find((candidate) => candidate.name === progression?.name);
  const chords = progression?.chords ?? [];
  const chord = selected === null ? undefined : chords[selected];
  const color = getTrackColor(part.letter ? part.letter.charCodeAt(0) - 65 : 0);
  function edit(next: Progression['chords']): void {
    onChange({ name: OWN_NAME, chords: next });
  }
  const label = part.letter ? (
    <>
      <span className="harmony-part-letter" style={{ background: color }}>
        {part.letter}
      </span>
      {part.bars} bars
    </>
  ) : (
    'The whole song'
  );
  return (
    <div className="harmony-part">
      <PartRow
        label={label}
        name={part.letter ? `progression of ${part.letter}` : 'progression'}
        isLocked={isLocked}
        onRoll={() => {
          setSelected(null);
          onRoll();
        }}
        onToggleLock={onToggleLock}
      >
        <select
          value={preset ? preset.id : progression ? AS_IT_IS : NO_PROGRESSION}
          aria-label={`the progression of ${part.letter ?? 'the whole song'}`}
          onChange={(event) => {
            setSelected(null);
            const picked = presets.find((candidate) => candidate.id === event.target.value);
            if (picked) onChange({ name: picked.name, chords: picked.chords });
            else if (event.target.value === NO_PROGRESSION) onChange(null);
          }}
        >
          <option value={NO_PROGRESSION}>Claude's choice</option>
          {progression && !preset && <option value={AS_IT_IS}>{progression.name}</option>}
          {presets.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}: {writeProgression(candidate.chords)}
            </option>
          ))}
        </select>
      </PartRow>
      {progression && (
        <>
          <div className="harmony-part-tiles">
            {chords.map((current, i) => {
              const isOwn = !mode || isInMode(current.numeral, mode);
              const name = note ? getChordName(current.numeral, note) : null;
              const style: CSSProperties & Record<'--tile-color', string> = {
                flexGrow: current.bars,
                '--tile-color': color,
              };
              return (
                <button
                  key={i}
                  type="button"
                  className={`harmony-part-tile${isOwn ? '' : ' is-borrowed'}${selected === i ? ' is-selected' : ''}`}
                  style={style}
                  onClick={() => setSelected(selected === i ? null : i)}
                  data-tooltip={`${current.numeral}${name ? ` (${name})` : ''}, ${writeBars(current.bars)} ${current.bars > 1 ? 'bars' : 'bar'}${isOwn ? '' : ', outside the mode'}`}
                >
                  <span className="harmony-part-numeral">{current.numeral}</span>
                  {name && <span className="harmony-part-name">{name}</span>}
                </button>
              );
            })}
            <button
              type="button"
              className="harmony-part-add"
              onClick={() => {
                const last = chords.at(-1);
                if (last) edit([...chords, { ...last }]);
                setSelected(chords.length);
              }}
              data-tooltip="add a chord at the end"
              aria-label="add a chord at the end"
            >
              <Plus />
            </button>
          </div>
          <p className="harmony-part-fit">{getProgressionFit(chords, part)}</p>
          {chord && selected !== null && (
            <ChordEditor
              chord={chord}
              ownChords={mode ? getModeChords(mode, false) : []}
              note={note}
              canRemove={chords.length > 1}
              onChange={(change) => edit(changeChord(chords, selected, change))}
              onMove={(step) => {
                edit(moveChord(chords, selected, step));
                setSelected(Math.min(chords.length - 1, Math.max(0, selected + step)));
              }}
              onCopy={() => {
                edit(duplicateChord(chords, selected));
                setSelected(selected + 1);
              }}
              onRemove={() => {
                edit(removeChord(chords, selected));
                setSelected(null);
              }}
            />
          )}
          <input
            key={writeProgression(chords)}
            className="harmony-part-notation"
            defaultValue={writeProgression(chords)}
            aria-label="the progression written short"
            data-tooltip="written short: numerals, a length after a colon (V:½, i:2)"
            spellCheck={false}
            onBlur={(event) => {
              const read = readProgression(event.target.value);
              setNotationError(read.error);
              if (read.chords && writeProgression(read.chords) !== writeProgression(chords)) {
                setSelected(null);
                edit(read.chords);
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
        </>
      )}
      {part.letter && part.hasVariations && (
        <div className="harmony-part-variation">
          <span className="harmony-part-variation-label">{part.letter}′ ends</span>
          {VARIATION_ENDINGS.map((ending) => (
            <button
              key={ending.value}
              type="button"
              className={`list-chip${variation === ending.value ? ' is-on' : ''}`}
              onClick={() => onVariation(ending.value)}
            >
              {ending.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
