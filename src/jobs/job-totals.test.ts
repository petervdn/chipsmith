// The totals of the jobs that are over: the songs they made, the time they took, the tokens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Job } from '../../shared/job.types.ts';
import { getJobTotals } from './job-totals.ts';

const JOB: Job = {
  id: 'j0001',
  prompt: 'a groove',
  guides: [],
  tokens: 1000,
  nowTokens: null,
  songCount: 2,
  structure: null,
  harmony: null,
  created: '2026-10-17T10:00:00Z',
  phase: 'done',
  composeStep: null,
  phaseStarted: '2026-10-17T10:02:00Z',
  finished: '2026-10-17T10:02:00Z',
  notes: [],
  now: null,
  songs: [
    { title: 'One', state: 'done', songId: 's0001' },
    { title: 'Two', state: 'failed', songId: null },
  ],
  summary: null,
  error: null,
  promptedFrom: null,
  claudePid: null,
  removed: null,
};

test('the songs made, the time taken and the tokens, added up', () => {
  const failed: Job = { ...JOB, id: 'j0002', phase: 'failed', tokens: null, songs: [] };
  assert.deepEqual(getJobTotals([JOB, failed, { ...JOB, id: 'j0003' }]), {
    songCount: 2,
    seconds: 360,
    tokens: 2000,
  });
});

test('no jobs come to nothing', () => {
  assert.deepEqual(getJobTotals([]), { songCount: 0, seconds: 0, tokens: 0 });
});
