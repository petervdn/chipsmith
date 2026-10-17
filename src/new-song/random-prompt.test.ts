// A prompt takes one value of each part, without a count; rolling again keeps the kept
// parts and picks the others. The chips are one or two, said in words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChipsText, getPromptText, rollChips, rollParts } from './random-prompt.ts';

test('the first of every part', () => {
  assert.equal(
    getPromptText(rollParts(null, [], () => 0)),
    'Dark funk grooves for the NES and the SCC, in 4/4, with a walking bass.',
  );
});

test('the last of every part, never past it', () => {
  assert.equal(
    getPromptText(rollParts(null, [], () => 0.9999)),
    'Restless baroque dances for the SID, with a syncopated groove, with the melody doubled in octaves.',
  );
});

test('a kept part keeps its value; the others are picked again', () => {
  const first = rollParts(null, [], () => 0);
  const again = rollParts(first, ['chips', 'mood'], () => 0.9999);
  assert.deepEqual(
    [again.mood, again.chips, again.idea],
    ['dark', ['nes', 'scc'], 'with the melody doubled in octaves'],
  );
});

test('one chip, or now and then two, never the same twice', () => {
  assert.deepEqual(
    rollChips(() => 0.5),
    ['scc'],
  );
  assert.deepEqual(
    rollChips(() => 0),
    ['nes', 'scc'],
  );
  const twice = [0.1, 0.9, 0.9];
  assert.deepEqual(
    rollChips(() => twice.shift() ?? 0),
    ['scc', 'sid'],
  );
});

test('the chips in words', () => {
  assert.equal(getChipsText(['nes']), 'for the NES');
  assert.equal(getChipsText(['nes', 'scc']), 'for the NES and the SCC');
});
