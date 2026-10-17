// A step lasts until the next one, the last until the job's end; its share is of the whole job.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStepLengths } from './job-steps.ts';

test('each step until the next, the last until the end', () => {
  const notes = [
    { at: '2026-10-17T10:00:00Z', text: 'prompt received' },
    { at: '2026-10-17T10:00:10Z', text: 'reading' },
    { at: '2026-10-17T10:01:10Z', text: 'writing' },
  ];
  assert.deepEqual(getStepLengths(notes, '2026-10-17T10:00:00Z', '2026-10-17T10:01:40Z'), [
    { seconds: 10, share: 0.1 },
    { seconds: 60, share: 0.6 },
    { seconds: 30, share: 0.3 },
  ]);
});
