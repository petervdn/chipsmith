/**
 * The takes on their way in the song's clips column: for each job of takes running in the song, a
 * line per take not made yet, under the clip it is of (or the clip that take's line is listed
 * under, for a take of a take). Given the running jobs and the column's clips, gives values; knows
 * nothing of the page.
 */
import type { Job } from '../../shared/job.schema.ts';
import { getJobSongRows } from '../jobs/job-songs.ts';
import type { JobSongRow } from '../jobs/job-songs.ts';
import type { SongClip } from './song-clips.ts';

/**
 * A take on its way: the clip it is listed under, how many takes deep it is (one more than the clip
 * it is a take of), its label, and how far it is, in words.
 */
export type PendingTake = {
  key: string;
  clipId: string;
  depth: number;
  label: string;
  stateText: string;
};

/** How far a take not made yet is, in words, by the state of its line in the job. */
const STATE_TEXTS: Partial<Record<JobSongRow['state'], string>> = {
  unwritten: 'being written…',
  waiting: 'to render…',
  rendering: 'rendering…',
  failed: 'failed',
};

/**
 * Returns the takes on their way in a song, each under the clip the column lists it with.
 *
 * @param runningJobs - The jobs still on their way.
 * @param songId - The song being edited.
 * @param songClips - The column's clips, each with its takes.
 * @returns A line per take not made yet, in the jobs' order; none for a job of another song or of
 *   a clip the column does not list.
 */
export function getPendingTakes(
  runningJobs: Job[],
  songId: string,
  songClips: SongClip[],
): PendingTake[] {
  return runningJobs.flatMap((job) => {
    const takesOf = job.takesOf;
    if (takesOf?.song !== songId) return [];
    const listedUnder = songClips.find(
      ({ clip, takes }) =>
        clip.id === takesOf.clip || takes.some((take) => take.clip.id === takesOf.clip),
    );
    if (!listedUnder) return [];
    const parentDepth = listedUnder.takes.find((take) => take.clip.id === takesOf.clip)?.depth ?? 0;
    return getJobSongRows(job, true).flatMap((row, i) => {
      const stateText = STATE_TEXTS[row.state];
      if (!stateText) return [];
      const clipId = listedUnder.clip.id;
      return [
        { key: `${job.id}-${i}`, clipId, depth: parentDepth + 1, label: row.title, stateText },
      ];
    });
  });
}
