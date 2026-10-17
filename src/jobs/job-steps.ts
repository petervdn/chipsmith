/**
 * How long each step of a job took, its share of the job, and the tokens Claude wrote in it: a step
 * lasts from its note to the next one, the last until the job finished (or now, while it runs).
 * Knows nothing of the page.
 */
import type { JobNote } from '../../shared/job.types.ts';

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

/**
 * Returns the tokens Claude wrote in each step of a job: from the tokens counted at its note to
 * those at the next, the last step's to the job's count now.
 *
 * @param notes - The job's notes, a note per step, in order, each with the tokens at its writing.
 * @param endTokens - The job's tokens now (while it runs, with what Claude is in the middle of).
 * @returns The tokens per note, in their order; null for a step that wrote none or whose count is
 *   not known (a note from before they were kept).
 */
export function getStepTokens(notes: JobNote[], endTokens: number | null): (number | null)[] {
  return notes.map((note, i) => {
    const next = notes[i + 1];
    const to = next ? next.tokens : endTokens;
    if (note.tokens === null || to === null) return null;
    const tokens = to - note.tokens;
    return tokens > 0 ? tokens : null;
  });
}
