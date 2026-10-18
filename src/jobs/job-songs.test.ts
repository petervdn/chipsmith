// A job's songs as its card lists them, and their count in words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Job } from '../../shared/job.schema.ts';
import { getJobSongRows, getSongCountText } from './job-songs.ts';

const JOB: Job = {
  id: 'j0001',
  prompt: 'a groove',
  guides: [],
  tokens: null,
  nowTokens: null,
  songCount: 3,
  takesOf: null,
  structure: null,
  harmony: null,
  created: '2026-10-17T10:00:00Z',
  phase: 'composing',
  composeStep: null,
  phaseStarted: '2026-10-17T10:00:00Z',
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

const BUILT: Job['songs'] = [
  { title: 'One', state: 'done', songId: 's0001' },
  { title: 'Two', state: 'failed', songId: null },
];

test('before its script is built, a line for each song asked for, to be written', () => {
  assert.deepEqual(getJobSongRows(JOB, true), [
    { title: 'Song 1', state: 'unwritten', songId: null },
    { title: 'Song 2', state: 'unwritten', songId: null },
    { title: 'Song 3', state: 'unwritten', songId: null },
  ]);
  assert.equal(getSongCountText(JOB, true), '3 songs');
});

test('the songs built, then the ones asked for and not made once the job is over', () => {
  const job: Job = { ...JOB, phase: 'failed', songs: BUILT };
  assert.deepEqual(getJobSongRows(job, false), [
    ...BUILT,
    { title: 'Song 3', state: 'unmade', songId: null },
  ]);
  assert.equal(getSongCountText(job, false), '1 of 3 songs');
});

test('all made is the count alone', () => {
  const songs = BUILT.map((song, i) => ({ ...song, state: 'done' as const, songId: `s000${i}` }));
  assert.equal(getSongCountText({ ...JOB, phase: 'done', songCount: 2, songs }, false), '2 songs');
});

test('a job from before the count was asked lists only what it built', () => {
  const job: Job = { ...JOB, phase: 'done', songCount: null, songs: BUILT };
  assert.deepEqual(getJobSongRows(job, false), BUILT);
  assert.equal(getSongCountText(job, false), '1 of 2 songs');
  assert.equal(getSongCountText({ ...job, songs: [] }, false), null);
});

test('a job of takes of a clip counts and lists takes', () => {
  const job: Job = { ...JOB, takesOf: { clip: 'c0101', song: 's0050' } };
  assert.equal(getSongCountText(job, true), '3 takes');
  assert.equal(getJobSongRows(job, true)[0]?.title, 'Take 1');
});
