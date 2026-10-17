// How many of each the top bar's tabs hold: the songs and clips an unfiltered list shows (the
// rejected left out), the style guides and the jobs on their way; null for what has not been read
// yet, and for jobs when none is on its way.
import type { Status } from '../../shared/catalogue.types.ts';
import type { Job } from '../../shared/job.types.ts';
import { EMPTY_FILTER, isShown } from '../lists/list-filter.ts';
import { useClips } from '../queries/clips.ts';
import { isJobRunning } from '../queries/jobs.ts';
import { useGuides } from '../queries/guides.ts';
import { useSongs } from '../queries/songs.ts';

/** The counts of the top bar's tabs. */
export type TabCounts = {
  songCount: number | null;
  clipCount: number | null;
  guideCount: number | null;
  jobCount: number | null;
};

/**
 * Counts how many items an unfiltered list shows, which leaves the rejected out.
 *
 * @param statuses - The items' statuses.
 * @returns How many of them show.
 */
function getShownCount(statuses: Status[]): number {
  return statuses.filter((status) => isShown({ text: '', tags: [], status }, EMPTY_FILTER)).length;
}

/**
 * Counts the jobs that are on their way.
 *
 * @param jobs - Every job.
 * @returns How many are on their way, or null when none is.
 */
function getRunningCount(jobs: Job[]): number | null {
  const count = jobs.filter(isJobRunning).length;
  return count > 0 ? count : null;
}

/**
 * Gives the counts of the top bar's tabs, from what the lists read.
 *
 * @param jobs - Every job, of which those on their way are counted.
 * @returns The songs and clips an unfiltered list shows, the style guides and the jobs on their
 *   way; each null while it has not been read, and the jobs null when none is on its way.
 */
export function useTabCounts(jobs: Job[]): TabCounts {
  const { data: songListings } = useSongs();
  const { data: clipListings } = useClips();
  const { data: guides } = useGuides();
  return {
    songCount: songListings ? getShownCount(songListings.map(({ song }) => song.status)) : null,
    clipCount: clipListings ? getShownCount(clipListings.map(({ clip }) => clip.status)) : null,
    guideCount: guides ? guides.length : null,
    jobCount: getRunningCount(jobs),
  };
}
