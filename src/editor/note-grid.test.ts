// The note grid's edits: a note put in, moved in pitch and time with the off that ends it, made
// longer and shorter, taken out; none where a note is in the way; and the pitches shown at first.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ChannelRow } from '../../shared/clip-notes.schema.ts';
import {
  changeNoteLength,
  getFirstLowestPitch,
  getNoteEnd,
  moveNotePitch,
  moveNoteTime,
  putNote,
  removeNote,
} from './note-grid.ts';

const OFF = 180;
const ROWS: ChannelRow[] = [
  { row: 0, note: 96, instrument: 3, volume: null },
  { row: 2, note: OFF, instrument: null, volume: null },
  { row: 4, note: 100, instrument: 3, volume: 10 },
  { row: 6, note: null, instrument: null, volume: 6 },
];

function getNotes(rows: ChannelRow[]): [number, number | null][] {
  return rows.map(({ row, note }) => [row, note]);
}

test('a note sounds until the next note, off or the end', () => {
  assert.equal(getNoteEnd(ROWS, 0, 8), 2);
  assert.equal(getNoteEnd(ROWS, 4, 8), 8);
});

test('a note put in takes the instrument before it, and a row’s volume', () => {
  const rows = putNote(ROWS, 6, 98);
  assert.deepEqual(rows.at(-1), { row: 6, note: 98, instrument: 3, volume: 6 });
  assert.deepEqual(putNote(ROWS, 0, 97)[0], { row: 0, note: 97, instrument: 3, volume: null });
});

test('a note moves in pitch within what Furnace plays', () => {
  assert.equal(moveNotePitch(ROWS, 0, 12)[0]?.note, 108);
  assert.equal(moveNotePitch(ROWS, 2, 1), ROWS);
  assert.equal(moveNotePitch(ROWS, 4, 100), ROWS);
});

test('a note moves in time with the off that ends it, not past another note', () => {
  const later = moveNoteTime(ROWS, 0, 1, 8);
  assert.equal(later.row, 1);
  assert.deepEqual(getNotes(later.rows).slice(0, 2), [
    [1, 96],
    [3, OFF],
  ]);
  assert.equal(moveNoteTime(ROWS, 0, 2, 8).rows, ROWS);
  assert.equal(moveNoteTime(ROWS, 0, -1, 8).rows, ROWS);
  const intoVolume = moveNoteTime(ROWS, 4, 2, 8);
  assert.deepEqual(intoVolume.rows.at(-1), { row: 6, note: 100, instrument: 3, volume: 10 });
});

test('a note is made longer or shorter by its off, or one put in', () => {
  assert.deepEqual(getNotes(changeNoteLength(ROWS, 0, 1, 8)).slice(0, 2), [
    [0, 96],
    [3, OFF],
  ]);
  assert.deepEqual(getNotes(changeNoteLength(ROWS, 0, -1, 8)).slice(0, 2), [
    [0, 96],
    [1, OFF],
  ]);
  assert.equal(changeNoteLength(changeNoteLength(ROWS, 0, -1, 8), 0, -1, 8).length, 4);
  assert.deepEqual(changeNoteLength(ROWS, 4, -1, 8).at(-1), {
    row: 7,
    note: OFF,
    instrument: null,
    volume: null,
  });
  assert.equal(changeNoteLength(ROWS, 4, 1, 8), ROWS);
});

test('a note taken out leaves its row’s volume', () => {
  assert.deepEqual(removeNote(ROWS, 4)[2], { row: 4, note: null, instrument: null, volume: 10 });
  assert.equal(removeNote(ROWS, 0).length, 3);
});

test('the grid starts at the C below the notes, or near the middle of a wide spread', () => {
  assert.equal(getFirstLowestPitch(ROWS), 96);
  const octaveJumps = [77, 89].map((note, row) => ({ row, note, instrument: 3, volume: null }));
  assert.equal(getFirstLowestPitch(octaveJumps), 77);
  assert.equal(
    getFirstLowestPitch([...ROWS, { row: 7, note: 130, instrument: 3, volume: null }]),
    108,
  );
});
