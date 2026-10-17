// What the user writes of a reference, as they write it: kept in the box at once, written to the
// server a moment after they stop typing, when they leave the box or the page, and whether that is
// done.
import { useEffect, useRef, useState } from 'react';
import { useSaveReferenceNotes } from '../queries/references.ts';

/** How long after the last key the notes are written, in milliseconds. */
const SAVE_PAUSE = 800;

/** Whether the notes in the box are written: saved, being saved, waiting to be, or failed. */
export type NotesState = 'saved' | 'saving' | 'unsaved' | 'failed';

/** The notes in the box, and what to do with them. */
export type ReferenceNotes = {
  notes: string;
  state: NotesState;
  change: (notes: string) => void;
  saveNow: () => void;
};

/**
 * Keeps a reference's notes as they are written and writes them to the server.
 *
 * @param referenceId - The reference.
 * @param savedNotes - The notes as the server has them when the page opens.
 * @returns The notes in the box, whether they are written, and the handlers to change and write them.
 */
export function useReferenceNotes(referenceId: string, savedNotes: string): ReferenceNotes {
  const [notes, setNotes] = useState(savedNotes);
  const [state, setState] = useState<NotesState>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typed = useRef(savedNotes);
  const written = useRef(savedNotes);
  const { mutate: saveNotes } = useSaveReferenceNotes();

  function saveNow(): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const toWrite = typed.current;
    if (toWrite === written.current) {
      setState('saved');
      return;
    }
    setState('saving');
    saveNotes(
      { referenceId, notes: toWrite },
      {
        onSuccess: () => {
          written.current = toWrite;
          setState(typed.current === toWrite ? 'saved' : 'unsaved');
        },
        onError: () => setState('failed'),
      },
    );
  }

  function change(changed: string): void {
    typed.current = changed;
    setNotes(changed);
    setState('unsaved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(saveNow, SAVE_PAUSE);
  }

  // notes still waiting when the page is left are written then
  useEffect(
    () => () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      saveNotes({ referenceId, notes: typed.current });
    },
    [referenceId, saveNotes],
  );
  return { notes, state, change, saveNow };
}
