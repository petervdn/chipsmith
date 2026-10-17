/**
 * The songs of a job as its card lists them: the ones its script built, and until then a line for
 * each song asked for, so the count shows from the start; and that count in words. Given a job,
 * gives values; knows nothing of the page.
 */
import type { Job, JobSong } from '../../shared/job.types.ts';

/** A line of a job's songs: a built song, or one asked for and not built (yet). */
export type JobSongRow = {
  title: string;
  state: JobSong['state'] | 'unwritten' | 'unmade';
  songId: string | null;
};

/**
 * Returns the lines of a job's songs: the songs built, then one for each song asked for and not
 * built, to be written while the job runs and not made once it is over.
 *
 * @param job - The job.
 * @param isRunning - Whether the job is still on its way.
 * @returns The lines, in order.
 */
export function getJobSongRows(job: Job, isRunning: boolean): JobSongRow[] {
  const unbuiltCount = Math.max(0, (job.songCount ?? 0) - job.songs.length);
  const state: JobSongRow['state'] = isRunning ? 'unwritten' : 'unmade';
  const unbuilt = Array.from({ length: unbuiltCount }, (_unused, i) => ({
    title: `Song ${job.songs.length + i + 1}`,
    state,
    songId: null,
  }));
  return [...job.songs, ...unbuilt];
}

/**
 * Returns how many songs a job makes, in words: the count asked for while it runs, and once it is
 * over how many were made, of how many when that is fewer.
 *
 * @param job - The job.
 * @param isRunning - Whether the job is still on its way.
 * @returns Such as "3 songs" or "2 of 3 songs", or null for a job that asked for none and built none.
 */
export function getSongCountText(job: Job, isRunning: boolean): string | null {
  const askedCount = Math.max(job.songCount ?? 0, job.songs.length);
  if (askedCount === 0) return null;
  const madeCount = job.songs.filter((song) => song.songId).length;
  const noun = askedCount === 1 ? 'song' : 'songs';
  if (isRunning || madeCount === askedCount) return `${askedCount} ${noun}`;
  return `${madeCount} of ${askedCount} ${noun}`;
}
