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
import type { SentStructure } from '../shared/structure.types.ts';

/** The notes a job keeps; older ones are dropped. */
const MOST_NOTES = 200;

/** The jobs, by id, and the folder they are kept in. */
export type JobStore = { root: string; jobs: Map<string, Job> };

/**
 * Reads every job under `root`/jobs.
 *
 * @param root - The data folder.
 * @returns The jobs read.
 */
export function openJobs(root: string): JobStore {
  const store: JobStore = { root, jobs: new Map() };
  const folder = join(root, 'jobs');
  if (!existsSync(folder)) return store;
  for (const id of readdirSync(folder)) {
    const file = join(folder, id, 'job.json');
    if (!existsSync(file)) continue;
    try {
      const job: Job = JSON.parse(readFileSync(file, 'utf8'));
      // a job from before style guides has none, nor one from before removing or `now` those
      store.jobs.set(job.id, {
        ...job,
        guides: job.guides ?? [],
        removed: job.removed ?? null,
        now: job.now ?? null,
        structure: job.structure ?? null,
      });
    } catch {
      /* a job.json that does not read is left; jobs are a log, not data */
    }
  }
  return store;
}

/**
 * Returns the folder of a job's files: its script, Claude's log, the built .fur files.
 *
 * @param store - The jobs in memory.
 * @param jobId - The job's id.
 * @returns The path of the job's folder.
 */
export function getJobFolder(store: JobStore, jobId: string): string {
  return join(store.root, 'jobs', jobId);
}

/**
 * Makes a new job for a prompt and the guides chosen with it, queued, and writes it to its file.
 *
 * @param store - The jobs in memory.
 * @param prompt - The prompt.
 * @param guides - Copies of the guides chosen with the prompt.
 * @param promptedFrom - The id of the song whose prompt was sent again, or null.
 * @param structure - The structure chosen with the prompt, copied, or null for none.
 * @returns The job made.
 */
export function createJob(
  store: JobStore,
  prompt: string,
  guides: SentGuide[],
  promptedFrom: string | null,
  structure: SentStructure | null = null,
): Job {
  const id = claimId(store.root, JOB_IDS);
  const now = new Date().toISOString();
  const job: Job = {
    id,
    prompt,
    guides,
    structure,
    created: now,
    phase: 'queued',
    phaseStarted: now,
    finished: null,
    notes: [{ at: now, text: 'prompt received' }],
    now: null,
    songs: [],
    summary: null,
    error: null,
    claudePid: null,
    promptedFrom,
    removed: null,
  };
  saveJob(store, job);
  return job;
}

/**
 * Lists every job not removed, newest first.
 *
 * @param store - The jobs in memory.
 * @returns The jobs.
 */
export function listJobs(store: JobStore): Job[] {
  return [...store.jobs.values()]
    .filter((job) => !job.removed)
    .sort((first, second) => second.created.localeCompare(first.created));
}

/**
 * Takes a job that is over off the list. Its files stay, with `removed` in its job.json; a job still
 * running is an error.
 *
 * @param store - The jobs in memory.
 * @param jobId - The job's id; an unknown id is an error.
 */
export function removeJob(store: JobStore, jobId: string): void {
  const job = store.jobs.get(jobId);
  if (!job) throw new Error(`no job ${jobId}`);
  if (!job.finished) throw new Error(`job ${jobId} is still on its way`);
  updateJob(store, jobId, { removed: new Date().toISOString() });
}

/**
 * Changes a job and writes it to its file.
 *
 * @param store - The jobs in memory.
 * @param jobId - The job's id; an unknown id is an error.
 * @param change - The fields to change.
 * @returns The job changed.
 */
export function updateJob(store: JobStore, jobId: string, change: Partial<Job>): Job {
  const job = store.jobs.get(jobId);
  if (!job) throw new Error(`no job ${jobId}`);
  const next = { ...job, ...change };
  saveJob(store, next);
  return next;
}

/**
 * Moves a job to a phase, with a note saying so. Done or failed also marks it finished.
 *
 * @param store - The jobs in memory.
 * @param jobId - The job's id; an unknown id is an error.
 * @param phase - The phase it moves to.
 * @param note - The note saying so.
 * @returns The job changed.
 */
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

/**
 * Adds notes to a job. Only the last 200 notes are kept.
 *
 * @param store - The jobs in memory.
 * @param jobId - The job's id; an unknown id is an error.
 * @param texts - The notes' texts.
 * @returns The job changed.
 */
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
