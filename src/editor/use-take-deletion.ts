/**
 * Deleting the take a block plays (docs/adr/0039): asked first, then deleted on the server, which
 * puts the clip it was made from in the saved song's blocks; the draft's blocks get the same clip.
 */
import type { Clip } from '../../shared/clip.schema.ts';
import { useDeleteTake } from '../queries/clips.ts';
import { askToConfirm } from '../stores/confirm-store.ts';

/** What deleting a take needs of the editor. */
export type TakeDeletionParts = {
  songId: string;
  /** Puts one clip in place of another in every block of the draft, its undo steps too. */
  onReplaceClip: (fromClipId: string, toClipId: string) => void;
};

/**
 * Gives the handler that deletes a take, and how the deletion goes.
 *
 * @param parts - What deleting needs of the editor.
 * @param parts.songId - The song the take is deleted from.
 * @param parts.onReplaceClip - Puts one clip in place of another in the draft.
 * @returns `deleteTake`, called with the take; whether a deletion is on its way; and its error.
 */
export function useTakeDeletion({ songId, onReplaceClip }: TakeDeletionParts) {
  const { mutate, isPending, error } = useDeleteTake(onReplaceClip);
  async function deleteTake(take: Clip): Promise<void> {
    const isYes = await askToConfirm({
      question: `Delete the take “${take.variationLabel ?? take.id}”? Its blocks go back to the take it was made from. This cannot be undone.`,
      answer: 'Delete',
      isDanger: true,
    });
    if (!isYes) return;
    mutate({ clipId: take.id, songId });
  }
  return { deleteTake, isDeleting: isPending, error };
}
