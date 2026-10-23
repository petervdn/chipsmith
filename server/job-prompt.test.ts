// The prompt for takes of a clip names the clip, its song, the count, what a take keeps and the check.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Job } from '../shared/job.schema.ts';
import { getTakesPrompt } from './job-prompt.ts';
import type { TakeContext } from './take-context.ts';

const JOB: Job = {
  id: 'j0042',
  prompt: 'make the bass busier',
  guides: [],
  tokens: null,
  nowTokens: null,
  songCount: 3,
  model: null,
  effort: null,
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

const CONTEXT: TakeContext = {
  clipId: 'c0101',
  label: 'Bass',
  songId: 's0050',
  songTitle: 'Tide Pool',
  bpm: 120,
  beats: 4,
  seconds: 32,
  chips: ['NES'],
  rowCount: 256,
  rowsPerBar: 16,
  keptChannels: [{ channel: 2, name: 'Bass · Triangle' }],
  tracks: ['Bass · Triangle: c0101'],
  script: 'export default function makeSongs() {}',
  trackerText: null,
};

test('a prompt for takes of a stem names it, the count, the channel kept and the check', () => {
  const prompt = getTakesPrompt({
    job: JOB,
    folder: '/data/jobs/j0042',
    root: '/data',
    context: CONTEXT,
  });
  assert.match(prompt, /\/data\/clips\/c0101\//);
  assert.match(prompt, /"Tide Pool" \(s0050\)/);
  assert.match(prompt, /a run of 256 rows, 16 to a bar/);
  assert.match(prompt, /Make 3 takes/);
  assert.match(prompt, /song's Bass · Triangle \(channel 2\) alone/);
  assert.match(prompt, /export default function makeSongs/);
  assert.match(prompt, /--takes-of c0101/);
  assert.match(prompt, /make the bass busier/);
});

test('a prompt for takes of a whole clip keeps every channel', () => {
  const prompt = getTakesPrompt({
    job: { ...JOB, songCount: 1 },
    folder: '/data/jobs/j0042',
    root: '/data',
    context: { ...CONTEXT, keptChannels: null, script: null, trackerText: 'C-4 00 ..' },
  });
  assert.match(prompt, /Make 1 take:/);
  assert.match(prompt, /keeps every channel/);
  assert.match(prompt, /as tracker text/);
  assert.match(prompt, /C-4 00 \.\./);
});
