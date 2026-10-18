/**
 * A job's compose steps and stages, in the order they come: values the page and the server go
 * through at run time, kept apart from the job's schema so the page does not load it.
 */

/**
 * How far Claude has come while composing: `writing` once it first writes the job's script,
 * `checking` once it first runs the check on it. Before either it is preparing (reading the skills,
 * planning).
 */
export const COMPOSE_STEPS = ['writing', 'checking'] as const;

/** A compose step. */
export type ComposeStep = (typeof COMPOSE_STEPS)[number];

/** A job's stages from start to end, as the page groups its steps and shows its way through them. */
export const JOB_STAGES = [
  'preparing',
  'writing',
  'checking',
  'building',
  'rendering',
  'done',
] as const;

/** A job's stage. */
export type JobStageId = (typeof JOB_STAGES)[number];
