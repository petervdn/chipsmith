// A transposed take is labelled by how far it moved.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTransposeLabel } from './transpose-take.ts';

test('octaves by name, other steps in semitones', () => {
  assert.equal(getTransposeLabel(12), 'octave up');
  assert.equal(getTransposeLabel(-24), 'two octaves down');
  assert.equal(getTransposeLabel(1), 'up 1 semitone');
  assert.equal(getTransposeLabel(-5), 'down 5 semitones');
});
