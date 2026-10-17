// A chord is played with its root low and its tones in the middle, in the key's pitch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVoicing } from './chord-voicing.ts';

test('chords as notes in a key', () => {
  assert.deepEqual(getVoicing('i', 'A'), { bass: 45, tones: [57, 60, 64] });
  assert.deepEqual(getVoicing('♭VI', 'A'), { bass: 41, tones: [65, 69, 72] });
  assert.deepEqual(getVoicing('V7', 'C'), { bass: 43, tones: [55, 59, 62, 65] });
  assert.deepEqual(getVoicing('Isus4', 'C')?.tones, [60, 65, 67]);
  assert.deepEqual(getVoicing('vii°7', 'C')?.tones, [59, 62, 65, 68]);
  assert.equal(getVoicing('Am', 'C'), null);
});
