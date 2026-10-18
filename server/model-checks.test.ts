// A song's tracks are read field by field: a track saved before tracks had a level plays at 0 dB.
// A variation has a label and no other clip has one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ClipParent } from '../shared/clip.schema.ts';
import { checkTracks, checkVariationLabel } from './model-checks.ts';

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

const VARIATION: ClipParent = { clip: 'c0001', relation: 'variation' };
const SPLIT: ClipParent = { clip: 'c0001', relation: 'split' };

test('a variation keeps its label, trimmed; a clip that is not one has none', () => {
  assert.equal(checkVariationLabel(' walking bass ', VARIATION, 'label'), 'walking bass');
  assert.equal(checkVariationLabel(null, SPLIT, 'label'), null);
  assert.equal(checkVariationLabel(null, null, 'label'), null);
});

test('a variation without a label, or a label on a clip that is not one, is reported', () => {
  assert.throws(() => checkVariationLabel(null, VARIATION, 'label'), /label/);
  assert.throws(() => checkVariationLabel('  ', VARIATION, 'label'), /label is empty/);
  assert.throws(() => checkVariationLabel('busier', SPLIT, 'label'), /not a variation/);
});
