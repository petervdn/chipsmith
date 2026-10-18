// Changes to the selected clip (or the selected block's) made without Claude (docs/adr/0037): an octave or a semitone
// up or down, and Edit notes, which opens the note grid. Each makes a take, rendered on the server,
// and puts it in the block; it is listed with the clip's other takes. On a take, the note grid can
// update it instead (docs/adr/0039). Shown only for a clip that plays pitched notes.
import { useState } from 'react';
import { useTransposeClip } from '../queries/clips.ts';
import { NoteGrid } from './NoteGrid.tsx';
import '../jobs/jobs.css';
import './ClipOperations.css';

/** The steps offered, in semitones, with what each button says. */
const STEPS = [
  { semitones: -12, label: 'Octave down' },
  { semitones: -1, label: '−1' },
  { semitones: 1, label: '+1' },
  { semitones: 12, label: 'Octave up' },
];

type ClipOperationsProps = {
  clipId: string;
  songId: string;
  isTake: boolean;
  onMade: (clipId: string) => void;
  onReplaceClip: (fromClipId: string, toClipId: string) => void;
};

/**
 * Shows the quick changes to a clip.
 *
 * @param props - The component's props.
 * @param props.clipId - The clip changed.
 * @param props.songId - The song it is changed in.
 * @param props.isTake - Whether the clip is a take, which the note grid can update.
 * @param props.onMade - Called with the take's id once it is made, to put it in the block.
 * @param props.onReplaceClip - Called with a take and the take that updates it, to put it in the
 *   draft's blocks.
 * @returns The quick changes' element.
 */
export function ClipOperations({
  clipId,
  songId,
  isTake,
  onMade,
  onReplaceClip,
}: ClipOperationsProps) {
  const [isGridOpen, setGridOpen] = useState(false);
  const { mutate: transpose, isPending, error } = useTransposeClip();
  return (
    <div className="clip-operations">
      <h3 className="clip-operations-title">Quick changes</h3>
      <div className="clip-operations-buttons">
        {STEPS.map(({ semitones, label }) => (
          <button
            key={semitones}
            type="button"
            disabled={isPending}
            onClick={() => transpose({ clipId, songId, semitones }, { onSuccess: onMade })}
            data-tooltip={`a take with every note ${Math.abs(semitones) === 12 ? 'an octave' : 'a semitone'} ${semitones > 0 ? 'higher' : 'lower'}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={isGridOpen ? 'is-open' : ''}
          aria-expanded={isGridOpen}
          onClick={() => setGridOpen(!isGridOpen)}
          data-tooltip="move, add or take out notes yourself"
        >
          Edit notes
        </button>
        {isPending && (
          <span className="clip-operations-making">
            <span className="jobs-spinner" aria-hidden="true" /> making the take…
          </span>
        )}
      </div>
      {error && <p className="error">{error.message}</p>}
      {isGridOpen && (
        <NoteGrid
          key={clipId}
          clipId={clipId}
          songId={songId}
          isTake={isTake}
          onMade={onMade}
          onUpdated={onReplaceClip}
        />
      )}
    </div>
  );
}
