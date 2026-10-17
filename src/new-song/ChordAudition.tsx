// The chords in the Harmony panel, as what each part will use: a row per part of the structure (or
// one for the whole song), either the progression picked for it (▶ to hear it again, change, ✕) or
// Claude's choice (pick…). Picking opens, under that part's row, three presets that fit the scale
// and feel, each with ▶ to hear it on chip-like sounds and "use for A"; "three others" picks again.
// Chords show bar by bar (chord-bars.ts) with how many bars go round.
import { Dices, Play, Square, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Chord, Progression } from '../../shared/harmony.types.ts';
import type { ProgressionPreset } from '../../shared/progression-presets.ts';
import { getProgressionBars, writeBars } from '../../shared/progression-notation.ts';
import { writeChordBars } from './chord-bars.ts';
import { getTrackColor } from '../editor/timeline.ts';
import type { HarmonyPart } from './random-harmony.ts';
import '../lists/lists.css';
import './ChordAudition.css';

type ChordAuditionProps = {
  parts: HarmonyPart[];
  choosingPart: HarmonyPart | undefined;
  progressions: Record<string, Progression>;
  candidates: ProgressionPreset[];
  hearingNote: string;
  isNoteChosen: boolean;
  playingId: string | null;
  onPlay: (id: string, chords: Chord[]) => void;
  onStop: () => void;
  onChooseFor: (part: HarmonyPart | null) => void;
  onKeep: (preset: ProgressionPreset) => void;
  onDrop: (part: HarmonyPart) => void;
  onPickOthers: () => void;
};

/**
 * Shows what chords each part will use, and picking one for a part.
 *
 * @param props - The component's props.
 * @param props.parts - The parts a progression can be picked for.
 * @param props.choosingPart - The part one is being picked for, or undefined.
 * @param props.progressions - The progression picked for each part, by its key.
 * @param props.candidates - The presets to hear while picking.
 * @param props.hearingNote - The note they are heard and named in.
 * @param props.isNoteChosen - Whether that is the key's note chosen, or one picked to hear them on.
 * @param props.playingId - The id of the one playing, or null.
 * @param props.onPlay - Called with an id and chords to hear them.
 * @param props.onStop - Called to stop hearing.
 * @param props.onChooseFor - Called with the part to pick for, or null to stop picking.
 * @param props.onKeep - Called with the preset used for the part picked for.
 * @param props.onDrop - Called with a part whose progression goes back to Claude's choice.
 * @param props.onPickOthers - Called to pick three other presets.
 * @returns The chords' element.
 */
export function ChordAudition({
  parts,
  choosingPart,
  progressions,
  candidates,
  hearingNote,
  isNoteChosen,
  playingId,
  onPlay,
  onStop,
  onChooseFor,
  onKeep,
  onDrop,
  onPickOthers,
}: ChordAuditionProps) {
  function renderPlay(id: string, chords: Chord[]) {
    const isPlaying = playingId === id;
    return (
      <button
        type="button"
        className={`chord-audition-play${isPlaying ? ' is-on' : ''}`}
        onClick={() => (isPlaying ? onStop() : onPlay(id, chords))}
        aria-label={isPlaying ? 'stop' : 'hear it'}
        data-tooltip={isPlaying ? 'stop' : `hear it, in ${hearingNote}`}
      >
        {isPlaying ? <Square /> : <Play />}
      </button>
    );
  }
  function renderChords(chords: Chord[]) {
    const bars = getProgressionBars(chords);
    return (
      <span
        className="chord-audition-chords"
        data-tooltip={chords.map((chord) => chord.numeral).join(' ')}
      >
        <span className="chord-audition-bars">{writeChordBars(chords, hearingNote)}</span>
        <span className="chord-audition-length">
          {writeBars(bars)} {bars === 1 ? 'bar' : 'bars'}
        </span>
      </span>
    );
  }
  function renderChooser(part: HarmonyPart) {
    const name = part.letter ?? 'the song';
    return (
      <div className="chord-audition-chooser">
        <p className="chord-audition-chooser-head">
          Picking for {name}: hear them, then use the one you like.
        </p>
        {candidates.map((preset) => (
          <div key={preset.id} className="chord-audition-row">
            {renderPlay(preset.id, preset.chords)}
            <span className="chord-audition-name">{preset.name}</span>
            {renderChords(preset.chords)}
            <button
              type="button"
              className="chord-audition-button is-primary"
              onClick={() => onKeep(preset)}
            >
              use for {name}
            </button>
          </div>
        ))}
        <div className="chord-audition-chooser-actions">
          <button type="button" className="chord-audition-button" onClick={onPickOthers}>
            <Dices /> three others
          </button>
          <button type="button" className="chord-audition-button" onClick={() => onChooseFor(null)}>
            cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="chord-audition">
      <p className="chord-audition-hint">
        What each part will use: a progression you picked, or Claude's own in the scale and feel
        above.
        {isNoteChosen
          ? ''
          : ` Chords are named and heard in ${hearingNote}; the song's key is Claude's choice.`}
      </p>
      {parts.map((part) => {
        const progression = progressions[part.key];
        const isChoosing = choosingPart?.key === part.key;
        const style: CSSProperties & Record<'--part-color', string> = {
          '--part-color': part.letter
            ? getTrackColor(part.letter.charCodeAt(0) - 65)
            : 'var(--raised)',
        };
        return (
          <div key={part.key} className={`chord-audition-part${isChoosing ? ' is-choosing' : ''}`}>
            <div className={`chord-audition-row${progression ? ' is-picked' : ''}`}>
              <span className="chord-audition-letter" style={style}>
                {part.letter ?? 'Song'}
              </span>
              {progression ? (
                <>
                  <span className="chord-audition-name">{progression.name}</span>
                  {renderChords(progression.chords)}
                  <span className="chord-audition-actions">
                    {renderPlay(`picked-${part.key}`, progression.chords)}
                    <button
                      type="button"
                      className="chord-audition-button"
                      onClick={() => onChooseFor(isChoosing ? null : part)}
                    >
                      change
                    </button>
                    <button
                      type="button"
                      className="chord-audition-button"
                      onClick={() => onDrop(part)}
                      aria-label="back to Claude's choice"
                      data-tooltip="back to Claude's choice"
                    >
                      <X />
                    </button>
                  </span>
                </>
              ) : (
                <>
                  <span className="chord-audition-claude">Claude's choice</span>
                  <span className="chord-audition-actions">
                    <button
                      type="button"
                      className="chord-audition-button"
                      onClick={() => onChooseFor(isChoosing ? null : part)}
                    >
                      pick…
                    </button>
                  </span>
                </>
              )}
            </div>
            {isChoosing && renderChooser(part)}
          </div>
        );
      })}
    </div>
  );
}
