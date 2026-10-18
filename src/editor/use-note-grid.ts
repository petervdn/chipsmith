/**
 * The note grid's state (docs/adr/0037): the clip's notes read, the channel shown, its rows as
 * edited with their undo steps, the note selected, the pitches shown; the edits on the selected
 * note; and Save as new take, which makes a take of the edited rows and hands it on.
 */
import { useState } from 'react';
import type { ChannelRow } from '../../shared/clip-notes.schema.ts';
import { useClipNotes, useSaveNotes } from '../queries/clips.ts';
import {
  OCTAVE,
  changeNoteLength,
  getFirstLowestPitch,
  getNoteEnd,
  isPitch,
  moveNotePitch,
  moveNoteTime,
  putNote,
  removeNote,
} from './note-grid.ts';

/** What the note grid needs to be told. */
export type NoteGridTarget = {
  clipId: string;
  songId: string;
  /** Called with a take's id once it is made, to put it in the block. */
  onMade: (clipId: string) => void;
};

/**
 * Keeps the note grid's state and gives its edits.
 *
 * @param target - What the grid edits.
 * @param target.clipId - The clip whose notes are edited.
 * @param target.songId - The song it is edited in.
 * @param target.onMade - Called with the take's id once it is made.
 * @returns The notes read (or the query's error), the channel shown and its rows as edited, the
 *   selected note's row, the lowest pitch shown, and the handlers.
 */
export function useNoteGrid({ clipId, songId, onMade }: NoteGridTarget) {
  const [channelIndex, setChannelIndex] = useState(0);
  const [edits, setEdits] = useState<ChannelRow[][]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [shownLowest, setShownLowest] = useState<number | null>(null);
  const { data: notes, error } = useClipNotes(clipId);
  const { mutate: saveNotes, isPending: isMaking, error: makeError } = useSaveNotes();
  const channel = notes?.channels[channelIndex] ?? notes?.channels[0];
  const rows = edits.at(-1) ?? channel?.rows ?? [];
  const rowCount = channel?.rowCount ?? 0;
  const lowestPitch = shownLowest ?? getFirstLowestPitch(rows);
  function edit(next: ChannelRow[]): void {
    if (next !== rows) setEdits([...edits, next]);
  }
  function editSelected(change: (row: number) => ChannelRow[]): void {
    if (selectedRow !== null) edit(change(selectedRow));
  }
  function tapCell(row: number, pitch: number): void {
    const sounding = rows.find(
      (other) =>
        isPitch(other) &&
        other.note === pitch &&
        other.row <= row &&
        getNoteEnd(rows, other.row, rowCount) > row,
    );
    if (sounding) {
      setSelectedRow(sounding.row);
      return;
    }
    edit(putNote(rows, row, pitch));
    setSelectedRow(row);
  }
  return {
    notes,
    error: error ?? makeError,
    channel,
    channelIndex,
    rows,
    rowCount,
    selectedRow,
    lowestPitch,
    canUndo: edits.length > 0,
    isMaking,
    chooseChannel: (index: number) => {
      setChannelIndex(index);
      setEdits([]);
      setSelectedRow(null);
      setShownLowest(null);
    },
    tapCell,
    shiftPitches: (octaves: number) => setShownLowest(lowestPitch + octaves * OCTAVE),
    movePitch: (semitones: number) => editSelected((row) => moveNotePitch(rows, row, semitones)),
    moveTime: (by: number) => {
      if (selectedRow === null) return;
      const moved = moveNoteTime(rows, selectedRow, by, rowCount);
      edit(moved.rows);
      setSelectedRow(moved.row);
    },
    changeLength: (by: number) => editSelected((row) => changeNoteLength(rows, row, by, rowCount)),
    remove: () => {
      editSelected((row) => removeNote(rows, row));
      setSelectedRow(null);
    },
    undo: () => setEdits(edits.slice(0, -1)),
    startOver: () => {
      setEdits([]);
      setSelectedRow(null);
    },
    saveAsNewTake: () => {
      if (!channel || edits.length === 0) return;
      saveNotes({ clipId, songId, channel: channel.channel, rows }, { onSuccess: onMade });
    },
  };
}
