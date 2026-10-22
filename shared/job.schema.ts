/**
 * A job: one prompt on its way to songs, or to takes of a clip (docs/adr/0037), visible from the
 * moment it is sent. Its phases: Claude composes a script, the script builds a .fur file per song or
 * take, each is rendered; then done or failed. What older job.json files leave out is read as none.
 */
import { z } from 'zod';
import { sentGuideSchema } from './guide.schema.ts';
import { sentHarmonySchema } from './harmony.schema.ts';
import { COMPOSER_MODELS } from './composer-models.ts';
import { COMPOSE_STEPS, JOB_STAGES } from './job-stages.ts';
import { sentStructureSchema } from './structure.schema.ts';

/** Where a job is. */
export const jobPhaseSchema = z.enum([
  'queued',
  'composing',
  'building',
  'rendering',
  'done',
  'failed',
  'cancelled',
]);

/** Where a job is. */
export type JobPhase = z.infer<typeof jobPhaseSchema>;

/** What happened in a job, as it happened: Claude's notes and the steps after it. */
export const jobNoteSchema = z.object({
  at: z.string(),
  text: z.string(),
  /**
   * The output tokens Claude wrote in this step (estimated): a thought's, or a text's or tool call's
   * from its length; null for a step of the app's own, or from before steps kept their tokens.
   */
  tokens: z.number().nullable().default(null),
  /**
   * The stage this step shows the job in: a phase's start, or a write or check of the script; null
   * for a step that does not say, or from before steps kept their stage.
   */
  stage: z.enum(JOB_STAGES).nullable().default(null),
});

/** What happened in a job, as it happened. */
export type JobNote = z.infer<typeof jobNoteSchema>;

/** A note to add to a job: its text and its tokens, without the time it is added. */
export type NewNote = Omit<JobNote, 'at'>;

/** The clip a job makes takes of, and the song it was asked in. */
export const takesTargetSchema = z.object({ clip: z.string(), song: z.string() });

/** The clip a job makes takes of, and the song it was asked in. */
export type TakesTarget = z.infer<typeof takesTargetSchema>;

/** A song a job makes, or a take (its title the take's label, its song the one asked in). */
export const jobSongSchema = z.object({
  title: z.string(),
  state: z.enum(['waiting', 'rendering', 'done', 'failed']),
  songId: z.string().nullable(),
});

/** A song a job makes, or a take. */
export type JobSong = z.infer<typeof jobSongSchema>;

/** A job as jobs/<id>/job.json holds it. */
export const jobSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  /** The style guides chosen with the prompt, copied when it was sent. */
  guides: z.array(sentGuideSchema).default([]),
  /** The output tokens Claude used composing, thinking included: counted as it runs, exact at its end. */
  tokens: z.number().nullable().default(null),
  /** The tokens of what Claude is in the middle of while it composes (estimated), not yet in `tokens`. */
  nowTokens: z.number().nullable().default(null),
  /** How many songs (or takes) to make, set beside the Create button; null for a job from before it was. */
  songCount: z.number().nullable().default(null),
  /**
   * The model Claude composes with, as chosen beside Create; null for a job from before it could be
   * chosen, which composed with Claude Code's own default.
   */
  model: z.enum(COMPOSER_MODELS).nullable().default(null),
  /** The clip this job makes takes of, or null for a job that makes songs. */
  takesOf: takesTargetSchema.nullable().default(null),
  /** The structure chosen with the prompt, copied when it was sent, or null. */
  structure: sentStructureSchema.nullable().default(null),
  /**
   * The harmony chosen with the prompt, copied when it was sent, or null. A job is a log: one from
   * before a harmony's progressions had their mode reads it as none rather than not at all.
   */
  harmony: sentHarmonySchema.nullable().default(null).catch(null),
  created: z.string(),
  phase: jobPhaseSchema,
  /** How far composing has come, or null before Claude wrote the script (or for a job from before). */
  composeStep: z.enum(COMPOSE_STEPS).nullable().default(null),
  /** When the phase began. */
  phaseStarted: z.string(),
  finished: z.string().nullable().default(null),
  notes: z.array(jobNoteSchema).default([]),
  /**
   * What Claude is doing this moment while it composes, read from its log as it streams (thinking,
   * a file being written), or null when the last note says it.
   */
  now: z.string().nullable().default(null),
  songs: z.array(jobSongSchema).default([]),
  /** Claude's reply at the end of composing. */
  summary: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
  /** The song whose prompt this is, sent again; the songs the job makes note it. */
  promptedFrom: z.string().nullable().default(null),
  /** The process id of Claude while it composes, to see after a restart whether it still runs. */
  claudePid: z.number().nullable().default(null),
  /** When it was taken off the Jobs page, once over; its files are kept. */
  removed: z.string().nullable().default(null),
});

/** A job as jobs/<id>/job.json holds it. */
export type Job = z.infer<typeof jobSchema>;
