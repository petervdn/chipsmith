// The prompt for takes of a clip names the clip, its song, the count, what a take keeps and the check.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Job } from '../shared/job.schema.ts';
import { getTakesPrompt } from './job-prompt.ts';

const JOB: Job = {
  id: 'j0042',
  prompt: 'make the bass busier',
  guides: [],
  tokens: null,
  nowTokens: null,
  songCount: 3,
  model: null,
  takesOf: { clip: 'c0101', song: 's0050' },
  structure: null,
  harmony: null,
  created: '2026-10-18T00:00:00.000Z',
  phase: 'queued',
  composeStep: null,
  phaseStarted: '2026-10-18T00:00:00.000Z',
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

test('a prompt for takes of a stem names it, the count, the channel kept and the check', () => {
  const prompt = getTakesPrompt({
    job: JOB,
    takesOf: { clip: 'c0101', song: 's0050' },
    folder: '/data/jobs/j0042',
    root: '/data',
    keptChannels: ['Triangle'],
  });
  assert.match(prompt, /\/data\/clips\/c0101\//);
  assert.match(prompt, /\/data\/songs\/s0050\/song\.json/);
  assert.match(prompt, /Make 3 takes/);
  assert.match(prompt, /song's Triangle alone/);
  assert.match(prompt, /--takes-of c0101/);
  assert.match(prompt, /make the bass busier/);
});

test('a prompt for takes of a whole clip keeps every channel', () => {
  const prompt = getTakesPrompt({
    job: { ...JOB, songCount: 1 },
    takesOf: { clip: 'c0101', song: 's0050' },
    folder: '/data/jobs/j0042',
    root: '/data',
    keptChannels: null,
  });
  assert.match(prompt, /Make 1 take:/);
  assert.match(prompt, /keeps every channel/);
});
