// Transposing moves the notes of the channels asked, leaves note offs and the other channels, and
// fails rather than clamp a note past what Furnace plays.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FurFile } from './fur.types.ts';
import { NOTE_OFF, getNoteValue } from './notes.ts';
import { transposeFurFile } from './transpose.ts';

function getFurFile(notes: number[]): FurFile {
  return {
    song: {
      name: '',
      author: '',
      systemName: 'NES',
      comment: '',
      chips: [0x06],
      chipVolumes: [64],
      chipFlags: [null],
      channelCount: 5,
      tickRate: 60,
      speeds: [6],
      virtualTempo: { numerator: 150, denominator: 150 },
      patternLength: 4,
      highlights: { first: 4, second: 16 },
      orders: [[0], [0]],
      effectColumns: [1, 1],
      channelNames: ['', ''],
    },
    instruments: [],
    wavetables: [],
    patterns: [0, 1].map((channel) => ({
      channel,
      index: 0,
      rows: [...notes.map((note) => ({ note, instrument: 0 })), null],
    })),
  };
}

test('the channels asked move, note offs stay, the others are untouched', () => {
  const furFile = getFurFile([getNoteValue('C-3'), NOTE_OFF, getNoteValue('A-3')]);
  const transposed = transposeFurFile(furFile, 12, [1]);
  assert.deepEqual(
    transposed.patterns[1]?.rows.map((row) => row?.note),
    [getNoteValue('C-4'), NOTE_OFF, getNoteValue('A-4'), undefined],
  );
  assert.deepEqual(transposed.patterns[0], furFile.patterns[0]);
  assert.equal(furFile.patterns[1]?.rows[0]?.note, getNoteValue('C-3'));
});

test('a note past what Furnace plays is an error, not clamped', () => {
  assert.throws(() => transposeFurFile(getFurFile([2]), -12, [0]), /channel 1/);
  assert.throws(() => transposeFurFile(getFurFile([175]), 12, [0]), /past the notes/);
});
