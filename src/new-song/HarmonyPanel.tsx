// The Harmony panel on New: always the harmony chosen in one line, with 🎲 Roll for the unlocked
// rows and progressions and ▸ at its right; ▸ opens under them the key, its mode and the settings
// (each a row with a die and a lock; "any" is Claude's choice), how strictly it is followed, a
// progression per part of the structure chosen (or one for the whole song), and setting it all to
// any.
import { Dices } from 'lucide-react';
import { useState } from 'react';
import { getHarmonySummary } from '../../shared/harmony-prompt.ts';
import type { HarmonyOption } from '../../shared/harmony-settings.ts';
import {
  HARMONY_SETTING_NAMES,
  HARMONY_SETTINGS,
  STRICTNESSES,
} from '../../shared/harmony-settings.ts';
import { getMode, MODES, NOTES } from '../../shared/modes.ts';
import '../lists/lists.css';
import { FoldPanel } from './FoldPanel.tsx';
import { HarmonyPart } from './HarmonyPart.tsx';
import { PartRow } from './PartRow.tsx';
import { getPartLock } from './random-harmony.ts';
import type { useHarmonyChoice } from './use-harmony-choice.ts';
import './HarmonyPanel.css';

type HarmonyPanelProps = { choice: ReturnType<typeof useHarmonyChoice> };

/** The most options a setting shows as switches; one with more is a menu. */
const MOST_SWITCHES = 4;
/** What a menu's choice of "any" is valued. */
const ANY = '';
/** The notes and the modes as a menu's options. */
const NOTE_OPTIONS = NOTES.map((note) => ({ value: note, label: note }));
const MODE_OPTIONS = MODES.map(({ name }) => ({ value: name, label: name }));

/**
 * Shows the Harmony panel: the harmony chosen, and under it while open what changes it.
 *
 * @param props - The component's props.
 * @param props.choice - The harmony chosen for the prompt, and what changes it.
 * @returns The panel.
 */
export function HarmonyPanel({ choice }: HarmonyPanelProps) {
  const [isOpen, setOpen] = useState(false);
  const { choice: harmony, parts, locked, sent } = choice;
  const summary = sent ? getHarmonySummary(sent) : '';
  const mode = harmony.mode ? (getMode(harmony.mode) ?? null) : null;
  function renderMenu(
    options: readonly { value: string; label: string }[],
    value: string | null,
    onPick: (picked: string | null) => void,
    label: string,
  ) {
    return (
      <select
        value={value ?? ANY}
        aria-label={label}
        onChange={(event) => onPick(event.target.value === ANY ? null : event.target.value)}
      >
        <option value={ANY}>any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <FoldPanel
      label="Harmony"
      summary={
        summary ? (
          <p className="harmony-panel-summary">{summary}</p>
        ) : (
          <p className="harmony-panel-none">None: Claude chooses the harmony.</p>
        )
      }
      actions={
        <button
          type="button"
          className="harmony-panel-button"
          onClick={choice.roll}
          data-tooltip="pick the unlocked rows and progressions again"
        >
          <Dices /> Roll
        </button>
      }
      isOpen={isOpen}
      onToggle={() => setOpen(!isOpen)}
      toggleLabels={{
        open: 'hide the harmony',
        closed: 'change the harmony: the key, the chords, a progression per part',
      }}
    >
      <p className="harmony-panel-help">
        The harmony of the songs, optional: what is on any is Claude's choice. Chords are Roman
        numerals on the major scale of the key: upper case major, lower case minor; ♭VI is the major
        chord on the minor sixth.
      </p>
      <div className="harmony-panel-rows">
        <PartRow
          label="Key"
          name="key"
          isLocked={locked.includes('note')}
          onRoll={() => choice.rollRow('note')}
          onToggleLock={() => choice.toggleLock('note')}
        >
          {renderMenu(NOTE_OPTIONS, harmony.note, choice.setNote, 'the key')}
        </PartRow>
        <PartRow
          label="Mode"
          name="mode"
          isLocked={locked.includes('mode')}
          onRoll={() => choice.rollRow('mode')}
          onToggleLock={() => choice.toggleLock('mode')}
        >
          {renderMenu(MODE_OPTIONS, harmony.mode, choice.setMode, 'the mode')}
        </PartRow>
        {HARMONY_SETTING_NAMES.map((name) => {
          const { label } = HARMONY_SETTINGS[name];
          const options: readonly HarmonyOption[] = HARMONY_SETTINGS[name].options;
          const value = harmony.settings[name];
          return (
            <PartRow
              key={name}
              label={label}
              name={label.toLowerCase()}
              isLocked={locked.includes(name)}
              onRoll={() => choice.rollRow(name)}
              onToggleLock={() => choice.toggleLock(name)}
            >
              {options.length > MOST_SWITCHES
                ? renderMenu(options, value, (picked) => choice.setSetting(name, picked), label)
                : [{ value: null, label: 'any', ask: '' }, ...options].map((option) => (
                    <button
                      key={option.value ?? ANY}
                      type="button"
                      className={`list-chip${value === option.value ? ' is-on' : ''}`}
                      onClick={() => choice.setSetting(name, option.value)}
                      data-tooltip={option.ask || "Claude's choice"}
                    >
                      {option.label}
                    </button>
                  ))}
            </PartRow>
          );
        })}
      </div>
      <div className="harmony-panel-strictness">
        <span className="harmony-panel-label">How strictly</span>
        {STRICTNESSES.map((strictness) => (
          <button
            key={strictness.value}
            type="button"
            className={`list-chip${harmony.strictness === strictness.value ? ' is-on' : ''}`}
            onClick={() => choice.setStrictness(strictness.value)}
          >
            {strictness.label}
          </button>
        ))}
      </div>
      <h3 className="harmony-panel-heading">
        Progressions{' '}
        <span>
          {parts[0]?.letter ? 'per part of the structure' : 'for the whole song (no structure)'}
        </span>
      </h3>
      {parts.map((part) => (
        <HarmonyPart
          key={part.key}
          part={part}
          progression={harmony.progressions[part.key] ?? null}
          variation={harmony.variations[part.key] ?? 'same'}
          mode={mode}
          note={harmony.note}
          isLocked={locked.includes(getPartLock(part))}
          onRoll={() => choice.rollPart(part)}
          onToggleLock={() => choice.toggleLock(getPartLock(part))}
          onChange={(progression) => choice.setProgression(part, progression)}
          onVariation={(ending) => choice.setVariation(part, ending)}
        />
      ))}
      <div className="harmony-panel-end">
        <button type="button" className="harmony-panel-button" onClick={choice.clear}>
          Set all to any
        </button>
      </div>
    </FoldPanel>
  );
}
