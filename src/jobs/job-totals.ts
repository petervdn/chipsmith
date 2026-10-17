/**
 * The totals of a list of jobs: the songs they made, the time they took and the tokens Claude
 * wrote, as the Jobs page shows above them. Knows nothing of the page.
 */
import type { Job } from '../../shared/job.types.ts';

/** What a list of jobs came to. */
export type JobTotals = { songCount: number; seconds: number; tokens: number };

/**
 * Returns the totals of jobs that are over.
 *
 * @param jobs - The jobs, each finished.
 * @returns The songs made, the seconds taken (from each job's sending to its end) and the tokens.
 */
export function getJobTotals(jobs: Job[]): JobTotals {
  return jobs.reduce(
    (totals, job) => ({
      songCount: totals.songCount + job.songs.filter((song) => song.songId).length,
      seconds:
        totals.seconds +
        (job.finished ? Math.max(0, Date.parse(job.finished) - Date.parse(job.created)) / 1000 : 0),
      tokens: totals.tokens + (job.tokens ?? 0),
    }),
    { songCount: 0, seconds: 0, tokens: 0 },
  );
}
