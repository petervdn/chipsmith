// A step lasts until the next one, the last until the job's end; its share is of the whole job.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStepLengths, getStepSentence } from './job-steps.ts';

test('each step until the next, the last until the end', () => {
  const notes = [
    { at: '2026-10-17T10:00:00Z', text: 'Claude starts composing', tokens: null },
    { at: '2026-10-17T10:00:10Z', text: 'reading', tokens: null },
    { at: '2026-10-17T10:01:10Z', text: 'writing', tokens: null },
  ];
  assert.deepEqual(getStepLengths(notes, '2026-10-17T10:00:00Z', '2026-10-17T10:01:40Z'), [
    { seconds: 10, share: 0.1 },
    { seconds: 60, share: 0.6 },
    { seconds: 30, share: 0.3 },
  ]);
});

test('a step is a sentence: a capital first, one full stop last', () => {
  assert.equal(getStepSentence('rendering 1 song'), 'Rendering 1 song.');
  assert.equal(getStepSentence('Reading the write-song skill.'), 'Reading the write-song skill.');
  assert.equal(getStepSentence('writing the script…'), 'Writing the script…');
  assert.equal(
    getStepSentence('writing the script (3 KB so far)'),
    'Writing the script (3 KB so far).',
  );
  assert.equal(getStepSentence('  '), '');
});
