/**
 * The jobs in memory, each also in `jobs/<id>/job.json` so a restart keeps them: made when a prompt
 * is sent, changed as the job moves on, a note added at every step. Knows nothing of how a job runs.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { SentGuide } from '../shared/guide.types.ts';
import type { Job, JobPhase } from '../shared/job.types.ts';
import { JOB_IDS, claimId } from '../make/ids.ts';
import { writeJsonAtomically } from './store.ts';

/** The notes a job keeps; older ones are dropped. */
const MOST_NOTES = 200;

/** The jobs, by id, and the folder they are kept in. */
export type JobStore = { root: string; jobs: Map<string, Job> };

/** Reads every job under `root`/jobs. */
export function openJobs(root: string): JobStore {
  const store: JobStore = { root, jobs: new Map() };
  const folder = join(root, 'jobs');
  if (!existsSync(folder)) return store;
  for (const id of readdirSync(folder)) {
    const file = join(folder, id, 'job.json');
    if (!existsSync(file)) continue;
    try {
      const job: Job = JSON.parse(readFileSync(file, 'utf8'));
      // a job from before style guides has none
      store.jobs.set(job.id, { ...job, guides: job.guides ?? [] });
    } catch {
      /* a job.json that does not read is left; jobs are a log, not data */
    }
  }
  return store;
}

/** The folder of a job's files: its script, Claude's log, the built .fur files. */
export function getJobFolder(store: JobStore, jobId: string): string {
  return join(store.root, 'jobs', jobId);
}

/** Makes a new job for a prompt and the guides chosen with it, queued. */
export function createJob(
  store: JobStore,
  prompt: string,
  guides: SentGuide[],
  promptedFrom: string | null,
): Job {
  const id = claimId(store.root, JOB_IDS);
  const now = new Date().toISOString();
  const job: Job = {
    id,
    prompt,
    guides,
    created: now,
    phase: 'queued',
    phaseStarted: now,
    finished: null,
    notes: [{ at: now, text: 'prompt received' }],
    songs: [],
    summary: null,
    error: null,
    claudePid: null,
    promptedFrom,
  };
  saveJob(store, job);
  return job;
}

/** Changes a job and writes it. */
export function updateJob(store: JobStore, jobId: string, change: Partial<Job>): Job {
  const job = store.jobs.get(jobId);
  if (!job) throw new Error(`no job ${jobId}`);
  const next = { ...job, ...change };
  saveJob(store, next);
  return next;
}

/** Moves a job to a phase, with a note saying so. */
export function setPhase(store: JobStore, jobId: string, phase: JobPhase, note: string): Job {
  const now = new Date().toISOString();
  const isEnd = phase === 'done' || phase === 'failed';
  const job = updateJob(store, jobId, {
    phase,
    phaseStarted: now,
    ...(isEnd ? { finished: now } : {}),
  });
  return addNotes(store, job.id, [note]);
}

/** Adds notes to a job. */
export function addNotes(store: JobStore, jobId: string, texts: string[]): Job {
  const job = store.jobs.get(jobId);
  if (!job) throw new Error(`no job ${jobId}`);
  const at = new Date().toISOString();
  const notes = [...job.notes, ...texts.map((text) => ({ at, text }))].slice(-MOST_NOTES);
  return updateJob(store, jobId, { notes });
}

function saveJob(store: JobStore, job: Job): void {
  writeJsonAtomically(join(getJobFolder(store, job.id), 'job.json'), job);
  store.jobs.set(job.id, job);
}
