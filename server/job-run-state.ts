/**
 * A job's Claude runs as job.json keeps them, and what the job shows of them together: its tokens
 * (all the runs'), how far composing has come (as far as the least advanced run), and Claude's
 * reply (each run's, named). Each run's files are its own: the first's `script.ts`, `claude.log`
 * and `build/`, as a job of one run always had; the second's `script-2.ts`, `claude-2.log`,
 * `build-2/`, and so on. Knows nothing of Claude or the renders.
 */
import { join } from 'node:path';
import type { ComposeStep } from '../shared/job-stages.ts';
import type { Job, JobRun } from '../shared/job.schema.ts';
import type { JobStore } from './jobs.ts';
import { getJobFolder, updateJob } from './jobs.ts';

/** A run's files in its job's folder. */
export type RunFiles = { script: string; log: string; build: string };

/** A run of a job, by the job's id and the run's place among its runs, from 0. */
export type RunPlace = { jobId: string; index: number };

/**
 * Returns a run's files.
 *
 * @param jobs - The jobs in memory.
 * @param place - The run.
 * @param place.jobId - Its job.
 * @param place.index - Its place among the job's runs, from 0.
 * @returns Its script, its log and its build folder.
 */
export function getRunFiles(jobs: JobStore, { jobId, index }: RunPlace): RunFiles {
  const folder = getJobFolder(jobs, jobId);
  const suffix = index === 0 ? '' : `-${index + 1}`;
  return {
    script: join(folder, `script${suffix}.ts`),
    log: join(folder, `claude${suffix}.log`),
    build: join(folder, `build${suffix}`),
  };
}

/**
 * Returns how many runs a job has: one per song or take asked for, or one to make as many as the
 * prompt says.
 *
 * @param songCount - How many songs or takes were asked for, or null.
 * @returns The number of runs.
 */
export function getRunCount(songCount: number | null): number {
  return songCount ?? 1;
}

/**
 * Returns the runs of a new job, each waiting to start.
 *
 * @param songCount - How many songs or takes were asked for, or null.
 * @returns The runs.
 */
export function getNewRuns(songCount: number | null): JobRun[] {
  return Array.from({ length: getRunCount(songCount) }, () => ({
    state: 'waiting',
    pid: null,
    composeStep: null,
    tokens: null,
    summary: null,
  }));
}

/**
 * Returns what a run's part is called on the job's card: "Song 2", "Take 1".
 *
 * @param job - The job.
 * @param index - The run's place, from 0.
 * @returns The name.
 */
export function getRunName(job: Job, index: number): string {
  return `${job.takesOf ? 'Take' : 'Song'} ${index + 1}`;
}

/**
 * Changes a run of a job, and with it what the job shows of its runs together.
 *
 * @param jobs - The jobs in memory.
 * @param place - The run.
 * @param change - The run's fields to change.
 * @returns The job changed.
 */
export function updateRun(jobs: JobStore, place: RunPlace, change: Partial<JobRun>): Job {
  const job = jobs.jobs.get(place.jobId);
  if (!job) throw new Error(`no job ${place.jobId}`);
  const runs = job.runs.map((run, i) => (i === place.index ? { ...run, ...change } : run));
  return updateJob(jobs, job.id, {
    runs,
    tokens: getRunsTokens(runs),
    composeStep: getRunsComposeStep(runs),
    summary: getRunsSummary(job, runs),
  });
}

/**
 * Returns the output tokens of a job's runs together.
 *
 * @param runs - The runs.
 * @returns Their tokens added up, or null when none has any yet.
 */
export function getRunsTokens(runs: JobRun[]): number | null {
  const counted = runs.flatMap((run) => (run.tokens === null ? [] : [run.tokens]));
  return counted.length === 0 ? null : counted.reduce((sum, tokens) => sum + tokens, 0);
}

/**
 * Returns how far a job's composing has come: as far as the least advanced of its runs that have
 * not failed.
 *
 * @param runs - The runs.
 * @returns The step, or null while one of them has none.
 */
export function getRunsComposeStep(runs: JobRun[]): ComposeStep | null {
  const steps = runs.filter((run) => run.state !== 'failed').map((run) => run.composeStep);
  if (steps.length === 0 || steps.includes(null)) return null;
  return steps.includes('writing') ? 'writing' : 'checking';
}

/**
 * Returns Claude's reply for a job: its run's, or each run's under its name.
 *
 * @param job - The job.
 * @param runs - Its runs.
 * @returns The reply, or null while there is none.
 */
export function getRunsSummary(job: Job, runs: JobRun[]): string | null {
  if (runs.length === 1) return runs[0]?.summary ?? null;
  const replies = runs.flatMap((run, i) =>
    run.summary ? [`${getRunName(job, i)}: ${run.summary}`] : [],
  );
  return replies.length === 0 ? null : replies.join('\n\n');
}
