// The song being edited: its tracks as a draft in the page, with undo and redo, the block or track
// selected, and saving the draft to the server or going back to the saved song. A draft that is not
// saved is lost when the page is left (to be solved later).
import { useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import type { Track } from '../../shared/song.types.ts';
import { useSaveTracks } from '../queries/songs.ts';
import type { BlockPlace, Edited } from './song-edits.ts';

/** What is selected: a block, a track, or nothing. */
export type Selection =
  { kind: 'block'; place: BlockPlace } | { kind: 'track'; trackId: string } | null;

/** The draft's tracks now, and the states before (for undo) and after (for redo). */
type History = { past: Track[][]; present: Track[]; future: Track[][] };

/**
 * Keeps the draft of an opened song.
 *
 * @param detail - The song as saved, with its clips.
 * @returns The draft's tracks and selection; `edit` and `changeTracks` to change them (an undo
 *   step each), `undo` and `redo`, whether there are changes, `save` and `revert`, and whether a
 *   save is under way or failed.
 */
export function useSongDraft(detail: SongDetail) {
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: detail.song.tracks,
    future: [],
  }));
  const [selection, setSelection] = useState<Selection>(null);
  const { mutate: saveTracks, isPending: isSaving, error: saveError } = useSaveTracks();
  const tracks = history.present;
  const hasChanges = JSON.stringify(tracks) !== JSON.stringify(detail.song.tracks);

  function keep(next: Track[]): void {
    setHistory(({ past, present }) => ({ past: [...past, present], present: next, future: [] }));
  }
  function edit(change: (current: Track[]) => Edited): void {
    const { tracks: next, place } = change(tracks);
    if (JSON.stringify(next) !== JSON.stringify(tracks)) keep(next);
    setSelection(place ? { kind: 'block', place } : null);
  }
  function changeTracks(change: (current: Track[]) => Track[]): void {
    const next = change(tracks);
    if (next !== tracks) keep(next);
  }
  function undo(): void {
    setHistory(({ past, present, future }) => {
      const previous = past.at(-1);
      return previous
        ? { past: past.slice(0, -1), present: previous, future: [present, ...future] }
        : { past, present, future };
    });
    setSelection(null);
  }
  function redo(): void {
    setHistory(({ past, present, future }) => {
      const [next, ...rest] = future;
      return next
        ? { past: [...past, present], present: next, future: rest }
        : { past, present, future };
    });
    setSelection(null);
  }
  function save(): void {
    if (hasChanges) saveTracks({ songId: detail.song.id, tracks });
  }
  function revert(): void {
    if (hasChanges) keep(detail.song.tracks);
    setSelection(null);
  }
  return {
    tracks,
    selection,
    select: setSelection,
    edit,
    changeTracks,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    hasChanges,
    save,
    revert,
    isSaving,
    saveError,
  };
}
