// A prompt takes one value of each part, without a count; rolling again keeps the kept
// parts and picks the others.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPromptText, rollParts } from './random-prompt.ts';

test('the first of every part', () => {
  assert.equal(
    getPromptText(rollParts(null, [], () => 0)),
    'Dark funk grooves for the NES, in 4/4, with a walking bass.',
  );
});

test('the last of every part, never past it', () => {
  assert.equal(
    getPromptText(rollParts(null, [], () => 0.9999)),
    'Restless baroque dances for the NES with the SCC, with a syncopated groove, with the melody doubled in octaves.',
  );
});

test('a kept part keeps its value; the others are picked again', () => {
  const first = rollParts(null, [], () => 0);
  const again = rollParts(first, ['chips', 'mood'], () => 0.9999);
  assert.deepEqual(
    [again.mood, again.chips, again.idea],
    ['dark', 'for the NES', 'with the melody doubled in octaves'],
  );
});
