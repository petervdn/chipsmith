/**
 * A job: one prompt on its way to songs, visible from the moment it is sent. Its phases: Claude
 * composes a script, the script builds a module per song, each song is rendered; then done or failed.
 */

/** Where a job is. */
export type JobPhase = 'queued' | 'composing' | 'building' | 'rendering' | 'done' | 'failed';

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
  created: string;
  phase: JobPhase;
  /** When the phase began. */
  phaseStarted: string;
  finished: string | null;
  notes: JobNote[];
  songs: JobSong[];
  /** Claude's reply at the end of composing. */
  summary: string | null;
  error: string | null;
  /** The process id of Claude while it composes, to see after a restart whether it still runs. */
  claudePid: number | null;
};
