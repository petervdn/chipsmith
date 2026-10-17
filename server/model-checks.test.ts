// A song's tracks are read field by field: a track saved before tracks had a level plays at 0 dB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTracks } from './model-checks.ts';

const BLOCK = { clip: 'c0001', start: 0, trim: null, repeats: 1 };

test('a track without a level reads as 0 dB, one with a level keeps it', () => {
  const tracks = checkTracks(
    [
      { id: 't1', name: 'Lead', blocks: [BLOCK] },
      { id: 't2', name: 'Bass', volume: -6, blocks: [] },
    ],
    'tracks',
  );
  assert.deepEqual(
    tracks.map((track) => track.volume),
    [0, -6],
  );
});

test('a level that is not a number is reported with its field', () => {
  assert.throws(
    () => checkTracks([{ id: 't1', name: 'Lead', volume: 'loud', blocks: [] }], 'tracks'),
    /tracks\[0\]\.volume/,
  );
});
