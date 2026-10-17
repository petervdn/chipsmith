// How many of each the top bar's tabs hold: the songs, the style guides and the jobs on
// their way; null for what has not been read yet, and for jobs when none is on its way.
import type { Job } from '../../shared/job.types.ts';
import { isJobRunning } from '../queries/jobs.ts';
import { useGuides } from '../queries/guides.ts';
import { useSongs } from '../queries/songs.ts';

/** The counts of the top bar's tabs. */
export type TabCounts = {
  songCount: number | null;
  guideCount: number | null;
  jobCount: number | null;
};

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
 * @returns How many songs and style guides there are and the jobs on their way; each null while it has not been read, and the jobs null when none is on its way.
 */
export function useTabCounts(jobs: Job[]): TabCounts {
  const { data: songListings } = useSongs();
  const { data: guides } = useGuides();
  return {
    songCount: songListings ? songListings.length : null,
    guideCount: guides ? guides.length : null,
    jobCount: getRunningCount(jobs),
  };
}
