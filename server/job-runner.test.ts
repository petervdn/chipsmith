// A job on its way can be cancelled: it ends as cancelled, and one that is over is left alone; a
// detached run is stopped with what it started.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isRunning, stopClaude } from './claude-run.ts';
import { cancelJob } from './job-runner.ts';
import { createJob, openJobs, setPhase } from './jobs.ts';

test('a job waiting is cancelled; one that is done stays done', () => {
  const store = openJobs(mkdtempSync(join(tmpdir(), 'chiptune-cancel-')));
  const waiting = createJob(store, {
    prompt: 'a fugue',
    guides: [],
    promptedFrom: null,
    model: 'opus',
    effort: null,
  });
  const done = createJob(store, {
    prompt: 'a march',
    guides: [],
    promptedFrom: null,
    model: 'opus',
    effort: null,
  });
  setPhase(store, done.id, 'done', 'done');
  cancelJob(store, waiting.id);
  cancelJob(store, done.id);
  assert.equal(store.jobs.get(waiting.id)?.phase, 'cancelled');
  assert.ok(store.jobs.get(waiting.id)?.finished);
  assert.equal(store.jobs.get(done.id)?.phase, 'done');
});

test('a detached run is stopped', async () => {
  const child = spawn('sleep', ['30'], { detached: true, stdio: 'ignore' });
  child.unref();
  const pid = child.pid ?? 0;
  assert.equal(isRunning(pid), true);
  stopClaude(pid);
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(isRunning(pid), false);
});
