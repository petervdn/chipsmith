// A prompt takes one value of each part, said as one song, without a count; rolling again keeps the
// kept parts and picks the others, each to go with the rest. The chips are one or two, said in words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ChipName } from '../../shared/chips.ts';
import {
  fitParts,
  getChipsText,
  getPartValues,
  getPromptText,
  rollChips,
  rollPart,
  rollParts,
} from './random-prompt.ts';

test('the first of every part', () => {
  assert.equal(
    getPromptText(rollParts(null, [], () => 0)),
    'A dark funk groove in C major for the NES and the SCC, in 4/4, with a walking bass.',
  );
});

test('the last of every part, never past it, and only what the chips can play', () => {
  assert.equal(
    getPromptText(rollParts(null, [], () => 0.9999)),
    'A restless baroque dance in B blues for the SID, with a syncopated groove, with the melody doubled in octaves.',
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

test('a piece takes only rhythms that go with it, an idea only chips that can play it', () => {
  const sid: ChipName[] = ['sid'];
  const waltz = { ...rollParts(null, [], () => 0), piece: 'waltz', chips: sid };
  assert.deepEqual(getPartValues('rhythm', waltz), [
    'at a relaxed 90 bpm',
    'at a driving 140 bpm',
    'in 3/4',
    'with a swung shuffle',
    'at a slow 70 bpm',
    'at a racing 170 bpm',
    'in half-time',
    'in double-time',
    'with a syncopated groove',
  ]);
  assert.ok(!getPartValues('idea', waltz).includes('where the triangle carries the melody'));
  const fitted = fitParts({ ...waltz, idea: 'where the triangle carries the melody' }, () => 0);
  assert.deepEqual([fitted.rhythm, fitted.idea], ['at a relaxed 90 bpm', 'with a walking bass']);
});

test('one part picked again, the others kept', () => {
  const first = rollParts(null, [], () => 0);
  const again = rollPart(first, 'mode', () => 0.9999);
  assert.deepEqual({ ...again, mode: first.mode }, first);
  assert.equal(again.mode, 'blues');
});

test('a mood that starts with a vowel takes "an"', () => {
  const parts = { ...rollParts(null, [], () => 0), mood: 'eerie' };
  assert.ok(getPromptText(parts).startsWith('An eerie funk groove'));
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
