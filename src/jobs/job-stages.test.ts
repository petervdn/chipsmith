// A job's stages: done before where it is, still to come after it, and at it the current one, or
// where it failed or was stopped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Job } from '../../shared/job.schema.ts';
import { getJobStages } from './job-stages.ts';

const JOB: Job = {
  id: 'j0001',
  prompt: '',
  guides: [],
  tokens: null,
  nowTokens: null,
  songCount: 1,
  model: null,
  takesOf: null,
  structure: null,
  harmony: null,
  created: '2026-10-17T10:00:00.000Z',
  phase: 'queued',
  composeStep: null,
  phaseStarted: '2026-10-17T10:00:00.000Z',
  finished: null,
  notes: [],
  now: null,
  songs: [],
  summary: null,
  error: null,
  promptedFrom: null,
  claudePid: null,
  removed: null,
};

const NOTE = {
  at: '2026-10-17T10:00:01.000Z',
  text: 'Claude starts composing',
  tokens: null,
  stage: null,
};

function getStates(job: Partial<Job>): string {
  return getJobStages({ ...JOB, ...job })
    .map((stage) => stage.state)
    .join(' ');
}

test('a job goes through its stages', () => {
  assert.equal(getStates({}), 'todo todo todo todo todo todo');
  assert.equal(getStates({ phase: 'composing' }), 'current todo todo todo todo todo');
  assert.equal(
    getStates({ phase: 'composing', composeStep: 'checking' }),
    'done done current todo todo todo',
  );
  assert.equal(getStates({ phase: 'rendering' }), 'done done done done current todo');
  assert.equal(getStates({ phase: 'done' }), 'done done done done done done');
});

test('a job that failed or was stopped shows where', () => {
  assert.equal(
    getStates({ phase: 'cancelled', composeStep: 'checking', notes: [NOTE] }),
    'done done stopped todo todo todo',
  );
  const songs = [{ title: 'A', state: 'failed' as const, songId: null }];
  assert.equal(
    getStates({ phase: 'failed', songs, notes: [NOTE] }),
    'done done done done failed todo',
  );
  assert.equal(getStates({ phase: 'cancelled' }), 'todo todo todo todo todo todo');
});
