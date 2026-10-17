// A step lasts until the next one, the last until the job's end; its share is of the whole job. Its
// tokens are those counted from its note to the next.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStepLengths, getStepTokens } from './job-steps.ts';

test('each step until the next, the last until the end', () => {
  const notes = [
    { at: '2026-10-17T10:00:00Z', text: 'prompt received', tokens: null },
    { at: '2026-10-17T10:00:10Z', text: 'reading', tokens: null },
    { at: '2026-10-17T10:01:10Z', text: 'writing', tokens: null },
  ];
  assert.deepEqual(getStepLengths(notes, '2026-10-17T10:00:00Z', '2026-10-17T10:01:40Z'), [
    { seconds: 10, share: 0.1 },
    { seconds: 60, share: 0.6 },
    { seconds: 30, share: 0.3 },
  ]);
});

test('the tokens of a step: from its note to the next, the last to the count now', () => {
  const notes = [
    { at: '2026-10-17T10:00:00Z', text: 'prompt received', tokens: 0 },
    { at: '2026-10-17T10:00:10Z', text: 'reading', tokens: 0 },
    { at: '2026-10-17T10:01:10Z', text: 'writing', tokens: 1200 },
  ];
  assert.deepEqual(getStepTokens(notes, 5000), [null, 1200, 3800]);
});

test('no tokens for a note from before they were kept, nor for a count that went down', () => {
  const notes = [
    { at: '2026-10-17T10:00:00Z', text: 'old', tokens: null },
    { at: '2026-10-17T10:00:10Z', text: 'streamed', tokens: 900 },
  ];
  assert.deepEqual(getStepTokens(notes, 800), [null, null]);
});
