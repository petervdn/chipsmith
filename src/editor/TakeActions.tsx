// What can be done to a take itself (docs/adr/0039): its name changed in place (✎, then a field
// with ✓ and ✕), or the take deleted (asked first, its blocks going back to the clip it was made
// from). Nothing for a clip that is not a take.
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { useSetVariationLabel } from '../queries/clips.ts';
import { useTakeDeletion } from './use-take-deletion.ts';
import './TakeActions.css';

type TakeActionsProps = {
  take: Clip;
  songId: string;
  onReplaceClip: (fromClipId: string, toClipId: string) => void;
};

/**
 * Shows ✎ and the trash can for a take, and the field its name is changed in.
 *
 * @param props - The component's props.
 * @param props.take - The take, or a clip that is not one (then nothing is shown).
 * @param props.songId - The song it is edited in.
 * @param props.onReplaceClip - Called with a deleted take's id and the clip that replaces it, to put
 *   that clip in the draft's blocks.
 * @returns The actions' element, or null for a clip that is not a take.
 */
export function TakeActions({ take, songId, onReplaceClip }: TakeActionsProps) {
  const [renamed, setRenamed] = useState<string | null>(null);
  const { mutate: setLabel, error } = useSetVariationLabel();
  const deletion = useTakeDeletion({ songId, onReplaceClip });
  if (!take.variationLabel) return null;
  function saveLabel(): void {
    const label = renamed?.trim();
    if (label) setLabel({ clipId: take.id, variationLabel: label });
    setRenamed(null);
  }
  return (
    <>
      {renamed === null ? (
        <span className="take-actions">
          <button
            type="button"
            onClick={() => setRenamed(take.variationLabel ?? '')}
            data-tooltip="rename this take"
            aria-label="rename this take"
          >
            <Pencil />
          </button>
          <button
            type="button"
            className="take-actions-delete"
            disabled={deletion.isDeleting}
            onClick={() => void deletion.deleteTake(take)}
            data-tooltip="delete this take"
            aria-label="delete this take"
          >
            <Trash2 />
          </button>
        </span>
      ) : (
        <form
          className="take-actions-name"
          onSubmit={(event) => {
            event.preventDefault();
            saveLabel();
          }}
        >
          <input
            value={renamed}
            onChange={(event) => setRenamed(event.target.value)}
            aria-label="the take's name"
            autoFocus
          />
          <button type="submit" disabled={!renamed.trim()} aria-label="save the name">
            <Check />
          </button>
          <button type="button" onClick={() => setRenamed(null)} aria-label="keep the old name">
            <X />
          </button>
        </form>
      )}
      {error && <p className="error">{error.message}</p>}
      {deletion.error && <p className="error">{deletion.error.message}</p>}
    </>
  );
}
