// A job that is over can be taken off the list and stays off after a restart; one on its way cannot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJob, listJobs, openJobs, removeJob, setPhase } from './jobs.ts';

function makeStore() {
  return openJobs(mkdtempSync(join(tmpdir(), 'chiptune-jobs-')));
}

test('a job that is over is taken off the list, and stays off when read again', () => {
  const store = makeStore();
  const kept = createJob(store, {
    prompt: 'a fugue',
    guides: [],
    promptedFrom: null,
    model: 'opus',
    effort: null,
  });
  const removed = createJob(store, {
    prompt: 'a funk groove',
    guides: [],
    promptedFrom: null,
    model: 'opus',
    effort: null,
  });
  setPhase(store, removed.id, 'done', 'done');
  removeJob(store, removed.id);
  assert.deepEqual(
    listJobs(store).map((job) => job.id),
    [kept.id],
  );
  assert.deepEqual(
    listJobs(openJobs(store.root)).map((job) => job.id),
    [kept.id],
  );
});

test('a job on its way cannot be removed', () => {
  const store = makeStore();
  const job = createJob(store, {
    prompt: 'a fugue',
    guides: [],
    promptedFrom: null,
    model: 'opus',
    effort: null,
  });
  assert.throws(() => removeJob(store, job.id));
});
