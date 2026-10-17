/**
 * A job's stages from start to end, as the page shows its way through them: preparing (reading the
 * skills, planning), writing the script, checking it, building the .fur files, rendering, done.
 * Each is done, the current one, still to come, or where the job failed or was stopped. Given a
 * job, gives the stages; knows nothing of the page.
 */
import type { ComposeStep, Job } from '../../shared/job.types.ts';

/** Where a job is with a stage. */
export type StageState = 'done' | 'current' | 'todo' | 'failed' | 'stopped';

/** A stage of a job, named, and where the job is with it. */
export type JobStage = { name: string; state: StageState };

/** The stages, in order. */
const STAGE_NAMES = ['Preparing', 'Writing', 'Checking', 'Building', 'Rendering', 'Done'];

/** The stage each compose step reaches. */
const COMPOSE_STAGES = { writing: 1, checking: 2 } satisfies Record<ComposeStep, number>;

/**
 * Returns a job's stages and where it is with each.
 *
 * @param job - The job.
 * @returns The stages, in order.
 */
export function getJobStages(job: Job): JobStage[] {
  const reached = getReachedStage(job);
  return STAGE_NAMES.map((name, i) => ({ name, state: getStageState(job, i, reached) }));
}

/**
 * Returns the stage a job is at, or stopped at.
 *
 * @param job - The job.
 * @param job.phase - Its phase.
 * @param job.composeStep - How far composing came.
 * @param job.songs - The songs it built, and how far each came.
 * @param job.notes - Its steps: none for a job stopped before it started.
 * @returns The stage's place, from 0; -1 for a job not started.
 */
function getReachedStage({ phase, composeStep, songs, notes }: Job): number {
  if (phase === 'queued') return -1;
  if (phase === 'building') return 3;
  if (phase === 'rendering') return 4;
  if (phase === 'done') return STAGE_NAMES.length - 1;
  const composing = composeStep ? COMPOSE_STAGES[composeStep] : 0;
  if (phase === 'composing') return composing;
  if (songs.some((song) => song.state !== 'waiting')) return 4;
  if (songs.length > 0) return 3;
  return notes.length > 0 ? composing : -1;
}

/**
 * Returns where a job is with a stage.
 *
 * @param job - The job.
 * @param job.phase - Its phase: whether it is over, and how.
 * @param stage - The stage's place.
 * @param reached - The stage the job is at, or stopped at.
 * @returns Done before it, still to come after it; at it, the current one, or how the job ended.
 */
function getStageState({ phase }: Job, stage: number, reached: number): StageState {
  if (stage < reached) return 'done';
  if (stage > reached) return 'todo';
  if (phase === 'failed') return 'failed';
  if (phase === 'cancelled') return 'stopped';
  return phase === 'done' ? 'done' : 'current';
}
