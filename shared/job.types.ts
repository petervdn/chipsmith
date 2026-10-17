/**
 * A job: one prompt on its way to songs, visible from the moment it is sent. Its phases: Claude
 * composes a script, the script builds a .fur file per song, each song is rendered; then done or failed.
 */
import type { SentGuide } from './guide.types.ts';
import type { SentHarmony } from './harmony.types.ts';
import type { SentStructure } from './structure.types.ts';

/** Where a job is. */
export type JobPhase =
  'queued' | 'composing' | 'building' | 'rendering' | 'done' | 'failed' | 'cancelled';

/**
 * How far Claude has come while composing: `writing` once it first writes the job's script,
 * `checking` once it first runs the check on it. Before either it is preparing (reading the skills,
 * planning).
 */
export type ComposeStep = 'writing' | 'checking';

/** The compose steps in the order they come. */
export const COMPOSE_STEPS: ComposeStep[] = ['writing', 'checking'];

/** A job's stages from start to end, as the page groups its steps and shows its way through them. */
export type JobStageId = 'preparing' | ComposeStep | 'building' | 'rendering' | 'done';

/** The stages in the order they come. */
export const JOB_STAGES: JobStageId[] = [
  'preparing',
  'writing',
  'checking',
  'building',
  'rendering',
  'done',
];

/** What happened in a job, as it happened: Claude's notes and the steps after it. */
export type JobNote = {
  at: string;
  text: string;
  /**
   * The output tokens Claude wrote in this step (estimated): a thought's, or a text's or tool call's
   * from its length; null for a step of the app's own, or from before steps kept their tokens.
   */
  tokens: number | null;
  /**
   * The stage this step shows the job in: a phase's start, or a write or check of the script; null
   * for a step that does not say, or from before steps kept their stage.
   */
  stage: JobStageId | null;
};

/** A note to add to a job: its text and its tokens, without the time it is added. */
export type NewNote = Omit<JobNote, 'at'>;

/** A song a job makes, from the moment its script built it. */
export type JobSong = {
  title: string;
  state: 'waiting' | 'rendering' | 'done' | 'failed';
  songId: string | null;
};

/** A job as jobs/<id>/job.json holds it. */
export type Job = {
  id: string;
  prompt: string;
  /** The style guides chosen with the prompt, copied when it was sent. */
  guides: SentGuide[];
  /** The output tokens Claude used composing, thinking included: counted as it runs, exact at its end. */
  tokens: number | null;
  /** The tokens of what Claude is in the middle of while it composes (estimated), not yet in `tokens`. */
  nowTokens: number | null;
  /** How many songs to make, set beside the Create button; null for a job from before it was. */
  songCount: number | null;
  /** The structure chosen with the prompt, copied when it was sent, or null. */
  structure: SentStructure | null;
  /** The harmony chosen with the prompt, copied when it was sent, or null. */
  harmony: SentHarmony | null;
  created: string;
  phase: JobPhase;
  /** How far composing has come, or null before Claude wrote the script (or for a job from before). */
  composeStep: ComposeStep | null;
  /** When the phase began. */
  phaseStarted: string;
  finished: string | null;
  notes: JobNote[];
  /** What Claude is doing this moment while it composes, read from its log as it streams (thinking,
   * a file being written), or null when the last note says it. */
  now: string | null;
  songs: JobSong[];
  /** Claude's reply at the end of composing. */
  summary: string | null;
  error: string | null;
  /** The song whose prompt this is, sent again; the songs the job makes note it. */
  promptedFrom: string | null;
  /** The process id of Claude while it composes, to see after a restart whether it still runs. */
  claudePid: number | null;
  /** When it was taken off the Jobs page, once over; its files are kept. */
  removed: string | null;
};
