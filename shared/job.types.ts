/**
 * A job: one prompt on its way to songs, visible from the moment it is sent. Its phases: Claude
 * composes a script, the script builds a .fur file per song, each song is rendered; then done or failed.
 */
import type { SentGuide } from './guide.types.ts';
import type { SentStructure } from './structure.types.ts';

/** Where a job is. */
export type JobPhase =
  'queued' | 'composing' | 'building' | 'rendering' | 'done' | 'failed' | 'cancelled';

/** What happened in a job, as it happened: Claude's notes and the steps after it. */
export type JobNote = { at: string; text: string };

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
  /** How many songs to make, set beside the Create button; null for a job from before it was. */
  songCount: number | null;
  /** The structure chosen with the prompt, copied when it was sent, or null. */
  structure: SentStructure | null;
  created: string;
  phase: JobPhase;
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
