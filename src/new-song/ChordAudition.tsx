// The chords to hear and keep, in the Harmony panel: the part they are for (A, B… or the whole
// song), the progression kept for it, and three presets that fit the scale and feel, each with ▶ to
// hear it on chip-like sounds and Keep; "three others" picks again.
import { Check, Dices, Play, Square, X } from 'lucide-react';
import { getChordNames } from '../../shared/harmony-prompt.ts';
import type { Chord, Progression } from '../../shared/harmony.types.ts';
import type { ProgressionPreset } from '../../shared/progression-presets.ts';
import type { HarmonyPart } from './random-harmony.ts';
import '../lists/lists.css';
import './ChordAudition.css';

type ChordAuditionProps = {
  parts: HarmonyPart[];
  hearingPart: HarmonyPart | undefined;
  progressions: Record<string, Progression>;
  candidates: ProgressionPreset[];
  hearingNote: string;
  isNoteChosen: boolean;
  playingId: string | null;
  onPlay: (id: string, chords: Chord[]) => void;
  onStop: () => void;
  onHearFor: (part: HarmonyPart) => void;
  onKeep: (preset: ProgressionPreset) => void;
  onDrop: (part: HarmonyPart) => void;
  onPickOthers: () => void;
};

/**
 * Shows the chords to hear and keep.
 *
 * @param props - The component's props.
 * @param props.parts - The parts a progression can be kept for.
 * @param props.hearingPart - The part the presets are heard for.
 * @param props.progressions - The progression kept for each part, by its key.
 * @param props.candidates - The presets to hear.
 * @param props.hearingNote - The note they are heard and named in.
 * @param props.isNoteChosen - Whether that is the key's note chosen, or one picked to hear them on.
 * @param props.playingId - The id of the one playing, or null.
 * @param props.onPlay - Called with an id and chords to hear them.
 * @param props.onStop - Called to stop hearing.
 * @param props.onHearFor - Called with the part to hear presets for.
 * @param props.onKeep - Called with the preset kept for the part heard for.
 * @param props.onDrop - Called with a part whose progression is let go.
 * @param props.onPickOthers - Called to pick three other presets.
 * @returns The audition's element.
 */
export function ChordAudition({
  parts,
  hearingPart,
  progressions,
  candidates,
  hearingNote,
  isNoteChosen,
  playingId,
  onPlay,
  onStop,
  onHearFor,
  onKeep,
  onDrop,
  onPickOthers,
}: ChordAuditionProps) {
  const kept = hearingPart ? progressions[hearingPart.key] : undefined;
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
  return (
    <div className="chord-audition">
      <p className="chord-audition-hint">
        Hear a few that fit the scale and feel, and keep one; otherwise Claude chooses.
        {isNoteChosen ? '' : ` Heard in ${hearingNote}.`}
      </p>
      {parts.length > 1 && (
        <div className="chord-audition-parts">
          <span className="chord-audition-label">For</span>
          {parts.map((part) => (
            <button
              key={part.key}
              type="button"
              className={`list-chip${part.key === hearingPart?.key ? ' is-on' : ''}`}
              onClick={() => onHearFor(part)}
              data-tooltip={
                progressions[part.key]
                  ? `${part.letter} keeps ${progressions[part.key]?.name}`
                  : `${part.letter}: Claude's choice`
              }
            >
              {part.letter}
              {progressions[part.key] && <Check />}
            </button>
          ))}
        </div>
      )}
      {kept && hearingPart && (
        <div className="chord-audition-row is-kept">
          {renderPlay('kept', kept.chords)}
          <span className="chord-audition-name">
            {hearingPart.letter ? `${hearingPart.letter} keeps ` : 'Kept: '}
            {kept.name}
          </span>
          <span className="chord-audition-chords">
            {getChordNames(kept.chords, hearingNote).join(' · ')}
          </span>
          <button
            type="button"
            className="chord-audition-drop"
            onClick={() => onDrop(hearingPart)}
            aria-label="let it go: Claude's choice"
            data-tooltip="let it go: Claude's choice"
          >
            <X />
          </button>
        </div>
      )}
      {candidates.map((preset) => {
        const isKept = kept?.name === preset.name;
        return (
          <div key={preset.id} className="chord-audition-row">
            {renderPlay(preset.id, preset.chords)}
            <span className="chord-audition-name">{preset.name}</span>
            <span
              className="chord-audition-chords"
              data-tooltip={preset.chords.map((chord) => chord.numeral).join(' ')}
            >
              {getChordNames(preset.chords, hearingNote).join(' · ')}
            </span>
            <button
              type="button"
              className={`chord-audition-keep${isKept ? ' is-on' : ''}`}
              onClick={() => onKeep(preset)}
              disabled={isKept}
            >
              {isKept ? 'kept' : 'keep'}
            </button>
          </div>
        );
      })}
      <button type="button" className="chord-audition-others" onClick={onPickOthers}>
        <Dices /> three others
      </button>
    </div>
  );
}
