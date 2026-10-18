// Revert and Save for the song being edited, at the right of the song's title row (put there by
// SongEditor.tsx): both quiet while nothing has changed, Save lit in the accent once something has.
import type { useSongDraft } from './use-song-draft.ts';
import './SaveButtons.css';

type SaveButtonsProps = { draft: ReturnType<typeof useSongDraft> };

/**
 * Shows Revert and Save for the song being edited.
 *
 * @param props - The component's props.
 * @param props.draft - The song being edited: revert and save, and whether it changed.
 * @returns The buttons' element.
 */
export function SaveButtons({ draft }: SaveButtonsProps) {
  const isOff = !draft.hasChanges || draft.isSaving;
  return (
    <div className="save-buttons">
      <button
        type="button"
        className="save-buttons-button"
        onClick={draft.revert}
        disabled={isOff}
        data-tooltip="go back to the song as it was saved"
      >
        Revert
      </button>
      <button
        type="button"
        className={`save-buttons-button${draft.hasChanges ? ' is-lit' : ''}`}
        onClick={draft.save}
        disabled={isOff}
        data-tooltip="save the song as it is now (⌘S)"
      >
        {draft.isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
