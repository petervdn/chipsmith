// The song being edited: its tracks as a draft in the page, with undo and redo, the block or track
// selected, and saving the draft to the server or going back to the saved song. A new arrangement
// from the server (saved, or a take deleted on it) starts a fresh draft unless the draft has edits
// of its own; a clip replaced (a take deleted or updated) is replaced in every step of the draft. A
// draft that is not saved is lost when the page is left (to be solved later).
import { useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { replaceBlockClip } from '../../shared/block-clips.ts';
import type { Track } from '../../shared/song.schema.ts';
import { useSaveTracks } from '../queries/songs.ts';
import type { BlockPlace, Edited } from './song-edits.ts';

/** What is selected: a block, a track, or nothing. */
export type Selection =
  { kind: 'block'; place: BlockPlace } | { kind: 'track'; trackId: string } | null;

/**
 * The draft's tracks now, the states before (for undo) and after (for redo), and what the last change
 * was, when changes of one kind in a row make one step (a fader's moves).
 */
type History = { past: Track[][]; present: Track[]; future: Track[][]; stepKey: string | null };

/**
 * Keeps the draft of an opened song.
 *
 * @param detail - The song as saved, with its clips.
 * @returns The draft's tracks and selection; `edit` and `changeTracks` to change them (an undo
 *   step each; changes given the same step key in a row, as a fader's moves, make one step), `undo`
 *   and `redo`, `replaceClip` (no step), whether there are changes, `save` and `revert`, and whether
 *   a save is under way or failed.
 */
export function useSongDraft(detail: SongDetail) {
  const [history, setHistory] = useState<History>(() => startHistory(detail.song.tracks));
  const [selection, setSelection] = useState<Selection>(null);
  const [savedTracks, setSavedTracks] = useState(detail.song.tracks);
  const { mutate: saveTracks, isPending: isSaving, error: saveError } = useSaveTracks();
  const tracks = history.present;
  const savedJson = JSON.stringify(detail.song.tracks);
  const hasChanges = JSON.stringify(tracks) !== savedJson;
  if (JSON.stringify(savedTracks) !== savedJson) {
    setSavedTracks(detail.song.tracks);
    if (!hasChanges || JSON.stringify(tracks) === JSON.stringify(savedTracks)) {
      setHistory(startHistory(detail.song.tracks));
      setSelection(null);
    }
  }

  function keep(next: Track[], stepKey: string | null = null): void {
    setHistory(({ past, present, stepKey: lastKey }) =>
      stepKey !== null && stepKey === lastKey
        ? { past, present: next, future: [], stepKey }
        : { past: [...past, present], present: next, future: [], stepKey },
    );
  }
  function edit(change: (current: Track[]) => Edited): void {
    const { tracks: next, place } = change(tracks);
    if (JSON.stringify(next) !== JSON.stringify(tracks)) keep(next);
    setSelection(place ? { kind: 'block', place } : null);
  }
  function changeTracks(
    change: (current: Track[]) => Track[],
    stepKey: string | null = null,
  ): void {
    const next = change(tracks);
    if (next !== tracks) keep(next, stepKey);
  }
  function undo(): void {
    setHistory(({ past, present, future }) => {
      const previous = past.at(-1);
      return previous
        ? {
            past: past.slice(0, -1),
            present: previous,
            future: [present, ...future],
            stepKey: null,
          }
        : { past, present, future, stepKey: null };
    });
    setSelection(null);
  }
  function redo(): void {
    setHistory(({ past, present, future }) => {
      const [next, ...rest] = future;
      return next
        ? { past: [...past, present], present: next, future: rest, stepKey: null }
        : { past, present, future, stepKey: null };
    });
    setSelection(null);
  }
  function replaceClip(fromClipId: string, toClipId: string): void {
    setHistory(({ past, present, future, stepKey }) => ({
      past: past.map((step) => replaceBlockClip(step, fromClipId, toClipId)),
      present: replaceBlockClip(present, fromClipId, toClipId),
      future: future.map((step) => replaceBlockClip(step, fromClipId, toClipId)),
      stepKey,
    }));
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
    replaceClip,
    hasChanges,
    save,
    revert,
    isSaving,
    saveError,
  };
}

/**
 * Returns the history of a draft that starts at the saved tracks, with nothing to undo or redo.
 *
 * @param tracks - The saved tracks.
 * @returns The fresh history.
 */
function startHistory(tracks: Track[]): History {
  return { past: [], present: tracks, future: [], stepKey: null };
}
