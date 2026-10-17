// The Harmony panel on New: always the harmony chosen in one line, with 🎲 Roll for the unlocked
// rows and ▸ at its right; ▸ opens under them the scale (how the one chosen sounds under it), the
// key's note, the feel and the colour, each a row with a die and a lock ("any" is Claude's choice),
// then what chords each part will use, picked by ear or Claude's choice (ChordAudition.tsx), and setting it all to any. How one
// section leads into the next is the Structure panel's.
import { Dices } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { getHarmonySummary } from '../../shared/harmony-prompt.ts';
import { COLOURS, FEELS } from '../../shared/harmony-words.ts';
import { getMode, MODES, NOTES } from '../../shared/modes.ts';
import '../lists/lists.css';
import { ChordAudition } from './ChordAudition.tsx';
import { FoldPanel } from './FoldPanel.tsx';
import { PartRow } from './PartRow.tsx';
import type { HarmonyRowName } from './random-harmony.ts';
import { getHearingNote } from './random-harmony.ts';
import type { useHarmonyChoice } from './use-harmony-choice.ts';
import { useProgressionPreview } from './use-progression-preview.ts';
import type { PreviewStyle } from '../playback/progression-preview.ts';
import './HarmonyPanel.css';

type HarmonyPanelProps = { choice: ReturnType<typeof useHarmonyChoice> };

/** A choice of a row: its value and its label. */
type RowOption = { value: string; label: string };

/** What a menu's choice of "any" is valued. */
const ANY = '';
/** The options of the rows shown as switches, and of the key's note, a menu. */
const MODE_OPTIONS: RowOption[] = MODES.map(({ name }) => ({ value: name, label: name }));
const NOTE_OPTIONS: RowOption[] = NOTES.map((note) => ({ value: note, label: note }));

/**
 * Shows the Harmony panel: the harmony chosen, and under it while open what changes it.
 *
 * @param props - The component's props.
 * @param props.choice - The harmony chosen for the prompt, and what changes it.
 * @returns The panel.
 */
export function HarmonyPanel({ choice }: HarmonyPanelProps) {
  const [isOpen, setOpen] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<PreviewStyle>('broken');
  const preview = useProgressionPreview();
  const { choice: harmony, locked, sent } = choice;
  const summary = sent ? getHarmonySummary(sent) : '';
  const hearingNote = getHearingNote(harmony);
  const sound = harmony.mode ? getMode(harmony.mode)?.sound : undefined;
  function renderRow(name: HarmonyRowName, label: string, children: ReactNode) {
    return (
      <PartRow
        label={label}
        name={label.toLowerCase()}
        isLocked={locked.includes(name)}
        onRoll={() => choice.rollRow(name)}
        onToggleLock={() => choice.toggleLock(name)}
      >
        {children}
      </PartRow>
    );
  }
  function renderSwitches(name: HarmonyRowName, options: RowOption[], value: string | null) {
    return [{ value: ANY, label: 'any' }, ...options].map((option) => {
      const isOn = (value ?? ANY) === option.value;
      return (
        <button
          key={option.value || 'any'}
          type="button"
          className={`list-chip${isOn ? ' is-on' : ''}`}
          onClick={() => choice.setRow(name, option.value === ANY ? null : option.value)}
          aria-pressed={isOn}
        >
          {option.label}
        </button>
      );
    });
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
          data-tooltip="pick the unlocked rows again"
        >
          <Dices /> Roll
        </button>
      }
      isOpen={isOpen}
      onToggle={() => setOpen(!isOpen)}
      toggleLabels={{
        open: 'hide the harmony',
        closed: 'change the harmony: the scale, the feel, chords to hear and keep',
      }}
    >
      <p className="harmony-panel-help">
        The sound of the songs' chords, in plain words; any is Claude's choice. How one section
        leads into the next is set between the tiles of the structure.
      </p>
      {renderRow(
        'mode',
        'Scale',
        <>
          {renderSwitches('mode', MODE_OPTIONS, harmony.mode)}
          {sound && (
            <span className="harmony-panel-sound">
              {harmony.mode}: {sound}
            </span>
          )}
        </>,
      )}
      <div className="harmony-panel-rows">
        {renderRow(
          'note',
          'Key note',
          <select
            value={harmony.note ?? ANY}
            aria-label="the key's note"
            onChange={(event) =>
              choice.setRow('note', event.target.value === ANY ? null : event.target.value)
            }
          >
            <option value={ANY}>any</option>
            {NOTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>,
        )}
        {renderRow('colour', 'Colour', renderSwitches('colour', COLOURS, harmony.colour))}
      </div>
      {renderRow('feel', 'Feel', renderSwitches('feel', FEELS, harmony.feel))}
      <h3 className="harmony-panel-heading">
        Chords <span>optional</span>
      </h3>
      <ChordAudition
        parts={choice.parts}
        choosingPart={choice.choosingPart}
        progressions={harmony.progressions}
        candidates={choice.candidates}
        hearingNote={hearingNote}
        isNoteChosen={harmony.note !== null}
        playingId={preview.playingId}
        previewStyle={previewStyle}
        onPreviewStyle={setPreviewStyle}
        onPlay={(id, chords) => void preview.play(id, chords, hearingNote, previewStyle)}
        onStop={preview.stop}
        onChooseFor={choice.chooseFor}
        onKeep={choice.keep}
        onDrop={choice.drop}
        onPickOthers={choice.pickOthers}
      />
      <div className="harmony-panel-end">
        <button type="button" className="harmony-panel-button" onClick={choice.clear}>
          Set all to any
        </button>
      </div>
    </FoldPanel>
  );
}
