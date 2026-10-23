// The script kit: notes in true pitch moved for their channel, bars of notes with holds and rests,
// and drum patterns, each on the rows a bar's slots give.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getNoteValue, NOTE_OFF } from '../fur/notes.ts';
import { getEmptyRows, getNote, PITCH_SHIFT, writeBars, writeHits } from './score.ts';

test('a note in true pitch is its Furnace name, a pulse one an octave down', () => {
  assert.equal(getNote('A4'), getNoteValue('A-4'));
  assert.equal(getNote('A4', PITCH_SHIFT.pulse), getNoteValue('A-3'));
  assert.equal(getNote('C#3'), getNoteValue('C#3'));
  assert.equal(getNote('Bb2'), getNoteValue('A#2'));
  assert.throws(() => getNote('H2'), /not a note/);
});

test('bars of notes play on their slots, hold on -, and stop on a rest after a note', () => {
  const rows = getEmptyRows({ bars: 2, rowsPerBar: 8 });
  writeBars(rows, { bar: 1, rowsPerBar: 8, bars: ['D4 - . F4:9'], instrument: 2, volume: 12 });
  assert.deepEqual(rows.slice(0, 8), Array(8).fill(null));
  assert.deepEqual(rows[8], { note: getNoteValue('D-4'), instrument: 2, volume: 12 });
  assert.equal(rows[10], null);
  assert.deepEqual(rows[12], { note: NOTE_OFF });
  assert.deepEqual(rows[14], { note: getNoteValue('F-4'), instrument: 2, volume: 9 });
});

test('a rest with nothing sounding writes nothing, and slots must divide the bar', () => {
  const rows = getEmptyRows({ bars: 1, rowsPerBar: 16 });
  writeBars(rows, { bar: 0, rowsPerBar: 16, bars: ['. . C4 -'], instrument: 0 });
  assert.equal(rows[0], null);
  assert.equal(rows[8]?.note, getNoteValue('C-4'));
  assert.throws(() =>
    writeBars(rows, { bar: 0, rowsPerBar: 16, bars: ['C4 D4 E4'], instrument: 0 }),
  );
});

test('drum patterns play each letter on its slot', () => {
  const rows = getEmptyRows({ bars: 1, rowsPerBar: 16 });
  const kick = { note: 60, instrument: 3 };
  const snare = { note: 60, instrument: 4 };
  writeHits(rows, {
    bar: 0,
    rowsPerBar: 16,
    patterns: ['k... s... k.k. s...'],
    hits: new Map([
      ['k', kick],
      ['s', snare],
    ]),
  });
  assert.deepEqual(
    rows.map((row) => (row === kick ? 'k' : row === snare ? 's' : '.')).join(''),
    'k...s...k.k.s...',
  );
  assert.throws(() =>
    writeHits(rows, { bar: 0, rowsPerBar: 16, patterns: ['x'.repeat(16)], hits: new Map() }),
  );
});
