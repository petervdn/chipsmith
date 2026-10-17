/**
 * A job's steps as the page shows them: each alike, a capital first and no full stop last, whatever
 * the server wrote; and how long each took, with its share of the job: a step lasts from
 * its note to the next one, the last until the job finished (or now, while it runs); and where in
 * them each stage of the job starts. Knows nothing of the page.
 */
import type { JobNote, JobStageId } from '../../shared/job.types.ts';
import { JOB_STAGES } from '../../shared/job.types.ts';

/** A step's length, in seconds, and its share of the whole job, 0 to 1. */
export type StepLength = { seconds: number; share: number };

/**
 * Returns how long each step of a job took.
 *
 * @param notes - The job's notes, a note per step, in order.
 * @param created - When the job was made, as an ISO time.
 * @param end - When the job finished, as an ISO time, or the time now in milliseconds while it runs.
 * @returns A length per note, in their order.
 */
export function getStepLengths(
  notes: JobNote[],
  created: string,
  end: string | number,
): StepLength[] {
  const endTime = typeof end === 'number' ? end : Date.parse(end);
  const total = Math.max(1, endTime - Date.parse(created));
  return notes.map((note, i) => {
    const from = Date.parse(note.at);
    const next = notes[i + 1];
    const to = next ? Date.parse(next.at) : endTime;
    const length = Math.max(0, to - from);
    return { seconds: length / 1000, share: Math.min(1, length / total) };
  });
}

/** Full stops at the end of a step's words, taken off (… stays). */
const FULL_STOPS = /(?<!\.)\.+$/;

/**
 * Returns a step's words as the list shows them: a capital first, and no full stop last.
 *
 * @param text - The step's words, as the server wrote them.
 * @returns The words; an empty string for none.
 */
export function getStepText(text: string): string {
  const words = text.trim().replace(FULL_STOPS, '');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Returns where each stage of a job starts among its steps: at the first step that shows the job in
 * a stage later than any before it. A step back (writing again after a check) starts none.
 *
 * @param notes - The job's notes, a note per step, in order.
 * @returns Per note, the stage it starts, or null for one that starts none.
 */
export function getStageStarts(notes: JobNote[]): (JobStageId | null)[] {
  let reached = -1;
  return notes.map(({ stage }) => {
    const place = stage ? JOB_STAGES.indexOf(stage) : -1;
    if (!stage || place <= reached) return null;
    reached = place;
    return stage;
  });
}
