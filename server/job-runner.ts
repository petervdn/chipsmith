/**
 * Jobs on their way from prompt to songs or takes of a clip. Each job has a Claude run per song or
 * take asked for (job-runs.ts); up to MOST_RUNS go at once across the jobs, oldest job first, each
 * followed every second. A run's script is built and rendered as soon as it has composed, one
 * render at a time (job-render.ts), so its songs show while other runs still compose. A job is done
 * once all its runs are; a run that fails fails its part, and the job fails when nothing is made.
 */
import { join } from 'node:path';
import type { Job, JobRun } from '../shared/job.schema.ts';
import { readRunTokens } from './claude-log.ts';
import { stopClaude } from './claude-run.ts';
import { getMessage, renderRun } from './job-render.ts';
import type { RunPlace } from './job-run-state.ts';
import { getNewRuns, getRunName, updateRun } from './job-run-state.ts';
import type { RunWatch } from './job-runs.ts';
import { followRun, resumeRun, startRun } from './job-runs.ts';
import type { JobStore } from './jobs.ts';
import { addNotes, getJobFolder, setPhase, updateJob } from './jobs.ts';
import type { Store } from './store.ts';

/** Milliseconds between looks at the runs. */
const TICK = 1000;
/** The most Claude runs that compose at once, across all jobs. */
const MOST_RUNS = 4;

/**
 * Starts the ticker that moves jobs on. The runs that were composing when it started are followed
 * again; the ones that had composed are rendered, and, in a new process, the ones whose render was
 * under way are rendered again (a song made already is kept).
 *
 * @param jobs - The jobs in memory.
 * @param store - The clips and songs, looked at again as each song is made.
 * @param isResuming - Whether this is a new process; in a restart within the process a render under
 *   way is still going on.
 * @returns A function that stops the ticker; a render under way finishes, no other starts.
 */
export function startJobRunner(jobs: JobStore, store: Store, isResuming: boolean): () => void {
  const watches = new Map<string, RunWatch>();
  const renders: RunPlace[] = [];
  let isRendering = false;
  let isStopped = false;
  fillInTokens(jobs);
  for (const job of [...jobs.jobs.values()].filter((each) => !isOver(each))) {
    getRunsOf(jobs, job).forEach((run, index) => {
      const place = { jobId: job.id, index };
      if (run.state === 'composing') {
        watches.set(getKey(place), resumeRun(jobs, place, run.pid ?? undefined));
      } else if (run.state === 'composed' || (isResuming && run.state === 'building')) {
        renders.push(place);
      }
    });
  }
  function tick(): void {
    for (const [key, watch] of watches) {
      const job = jobs.jobs.get(watch.jobId);
      if (!job || isOver(job)) {
        watches.delete(key);
        continue;
      }
      try {
        const next = followRun(jobs, watch);
        if (next) watches.set(key, next);
        else {
          watches.delete(key);
          renders.push({ jobId: watch.jobId, index: watch.index });
        }
      } catch (error) {
        watches.delete(key);
        failRun(jobs, watch, error);
      }
    }
    for (
      let next = takeNextRun(jobs);
      next;
      next = watches.size < MOST_RUNS ? takeNextRun(jobs) : null
    ) {
      if (watches.size >= MOST_RUNS) break;
      try {
        watches.set(getKey(next), startRun(jobs, store, next));
      } catch (error) {
        failRun(jobs, next, error);
      }
    }
    void renderNext();
  }
  async function renderNext(): Promise<void> {
    if (isRendering || isStopped) return;
    const run = renders.shift();
    if (!run) return;
    isRendering = true;
    try {
      await renderRun(jobs, store, run);
    } catch (error) {
      failRun(jobs, run, error);
    } finally {
      isRendering = false;
      settleJob(jobs, run.jobId);
    }
  }
  const timer = setInterval(tick, TICK);
  return () => {
    clearInterval(timer);
    isStopped = true;
  };
}

/**
 * Returns the key a run is kept under while it composes.
 *
 * @param run - The run.
 * @param run.jobId - Its job.
 * @param run.index - Its place among the job's runs.
 * @returns Its job's id and its place.
 */
function getKey({ jobId, index }: RunPlace): string {
  return `${jobId}:${index}`;
}

/**
 * Returns whether a job is over: done, failed or cancelled.
 *
 * @param job - The job.
 * @returns Whether it is over.
 */
function isOver(job: Job): boolean {
  return job.phase === 'done' || job.phase === 'failed' || job.phase === 'cancelled';
}

/**
 * Returns a job's runs, giving a job from before runs the one run it had: composing, or composed
 * when it was building or rendering.
 *
 * @param jobs - The jobs in memory.
 * @param job - The job, not over.
 * @returns Its runs.
 */
function getRunsOf(jobs: JobStore, job: Job): JobRun[] {
  if (job.runs.length > 0 || job.phase === 'queued') return job.runs;
  const run: JobRun = {
    state: job.phase === 'composing' ? 'composing' : 'composed',
    pid: job.claudePid,
    composeStep: job.composeStep,
    tokens: job.tokens,
    summary: job.summary,
  };
  return updateJob(jobs, job.id, { runs: [run] }).runs;
}

/**
 * Returns the next run to start: the first waiting run of the oldest job that has one. A queued
 * job is given its runs and moves to composing.
 *
 * @param jobs - The jobs in memory.
 * @returns The run, or null when none waits.
 */
function takeNextRun(jobs: JobStore): RunPlace | null {
  const waiting = [...jobs.jobs.values()]
    .filter((job) => job.phase === 'queued' || job.phase === 'composing')
    .sort((first, second) => first.created.localeCompare(second.created));
  for (const job of waiting) {
    const runs = job.runs.length > 0 ? job.runs : getNewRuns(job.songCount);
    const index = runs.findIndex((run) => run.state === 'waiting');
    if (index < 0) continue;
    if (job.phase === 'queued') {
      updateJob(jobs, job.id, { runs });
      setPhase(jobs, job.id, 'composing', 'Claude starts composing');
    }
    return { jobId: job.id, index };
  }
  return null;
}

/**
 * Marks a run failed. A job of one run fails with it; in a job of several the failure is a note,
 * and the job settles once its other runs are over.
 *
 * @param jobs - The jobs in memory.
 * @param run - The run.
 * @param error - What went wrong.
 */
function failRun(jobs: JobStore, run: RunPlace, error: unknown): void {
  const job = jobs.jobs.get(run.jobId);
  if (!job || isOver(job)) return;
  updateRun(jobs, run, { state: 'failed', pid: null });
  if (job.runs.length === 1) {
    updateJob(jobs, job.id, { error: getMessage(error), now: null, nowTokens: null });
    setPhase(jobs, job.id, 'failed', `failed: ${getMessage(error)}`);
    return;
  }
  const text = `${getRunName(job, run.index)} failed: ${getMessage(error)}`;
  addNotes(jobs, job.id, [{ text, tokens: null, stage: null }]);
  settleJob(jobs, job.id);
}

/**
 * Ends a job once none of its runs has anything left to do: done when it made something, failed
 * when it made nothing.
 *
 * @param jobs - The jobs in memory.
 * @param jobId - The job.
 */
function settleJob(jobs: JobStore, jobId: string): void {
  const job = jobs.jobs.get(jobId);
  if (!job || isOver(job)) return;
  if (job.runs.some((run) => run.state !== 'built' && run.state !== 'failed')) return;
  const made = job.songs.filter((song) => song.state === 'done').length;
  const failed =
    job.songs.filter((song) => song.state === 'failed').length +
    job.runs.filter((run) => run.state === 'failed').length;
  if (made === 0) {
    const error = job.runs.length > 1 ? 'no run made anything (see the steps)' : 'nothing was made';
    updateJob(jobs, jobId, { error, now: null, nowTokens: null });
    setPhase(jobs, jobId, 'failed', `failed: ${error}`);
    return;
  }
  setPhase(jobs, jobId, 'done', failed ? `done, ${failed} failed` : 'done');
}

/**
 * Fills in the tokens of jobs over before tokens were kept, from their logs.
 *
 * @param jobs - The jobs in memory.
 */
function fillInTokens(jobs: JobStore): void {
  for (const job of jobs.jobs.values()) {
    if ((job.tokens ?? null) !== null || !isOver(job)) continue;
    const tokens = readRunTokens(join(getJobFolder(jobs, job.id), 'claude.log'));
    if (tokens !== null) updateJob(jobs, job.id, { tokens });
  }
}

/**
 * Cancels a job on its way: its runs' Claudes are stopped at once, and a render under way stops
 * after the song it is on. The songs made already stay.
 *
 * @param jobs - The jobs in memory.
 * @param jobId - The job to cancel; one that is over is left as it is.
 */
export function cancelJob(jobs: JobStore, jobId: string): void {
  const job = jobs.jobs.get(jobId);
  if (!job || job.finished) return;
  const pids = [job.claudePid, ...job.runs.map((run) => run.pid)];
  for (const pid of pids) if (pid) stopClaude(pid);
  const isMaking = job.runs.some((run) => run.state === 'building');
  setPhase(
    jobs,
    jobId,
    'cancelled',
    isMaking || job.phase === 'building' || job.phase === 'rendering'
      ? 'cancelled; the song being made is finished, the rest are not'
      : 'cancelled',
  );
}
