// Changes to the selected clip (or the selected block's) made without Claude (docs/adr/0037): an
// octave or a semitone up or down, or its slides taken out, each a take rendered on the server and
// put in the clip's place;
// it is listed with the clip's other takes. Edit notes opens the note grid, which the clip's section
// lays out under it. Shown only for a clip that plays pitched notes.
import { useRemoveSlides, useTransposeClip } from '../queries/clips.ts';
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
  isGridOpen: boolean;
  onToggleGrid: () => void;
  onMade: (clipId: string) => void;
};

/**
 * Shows the quick changes to a clip.
 *
 * @param props - The component's props.
 * @param props.clipId - The clip changed.
 * @param props.songId - The song it is changed in.
 * @param props.isGridOpen - Whether the note grid is open.
 * @param props.onToggleGrid - Called to open or close the note grid.
 * @param props.onMade - Called with the take's id once it is made, to put it in the clip's place.
 * @returns The quick changes' element.
 */
export function ClipOperations({
  clipId,
  songId,
  isGridOpen,
  onToggleGrid,
  onMade,
}: ClipOperationsProps) {
  const transposing = useTransposeClip();
  const removingSlides = useRemoveSlides();
  const isPending = transposing.isPending || removingSlides.isPending;
  const error = transposing.error ?? removingSlides.error;
  return (
    <div className="clip-operations">
      <h3 className="clip-operations-title">Quick changes</h3>
      <div className="clip-operations-buttons">
        {STEPS.map(({ semitones, label }) => (
          <button
            key={semitones}
            type="button"
            disabled={isPending}
            onClick={() => transposing.mutate({ clipId, songId, semitones }, { onSuccess: onMade })}
            data-tooltip={`a take with every note ${Math.abs(semitones) === 12 ? 'an octave' : 'a semitone'} ${semitones > 0 ? 'higher' : 'lower'}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={isPending}
          onClick={() => removingSlides.mutate({ clipId, songId }, { onSuccess: onMade })}
          data-tooltip="a take with every pitch slide taken out (portamento, pitch and note slides)"
        >
          No slides
        </button>
        <button
          type="button"
          className={isGridOpen ? 'is-open' : ''}
          aria-expanded={isGridOpen}
          onClick={onToggleGrid}
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
    </div>
  );
}
