// How many of each the top bar's tabs hold: the songs and clips an unfiltered list shows (the
// rejected left out), the style guides and the jobs on their way; null for what has not been read
// yet, and for jobs when none is on its way.
import type { Status } from '../shared/catalogue.types.ts';
import type { Job } from '../shared/job.types.ts';
import { EMPTY_FILTER, isShown } from './list-filter.ts';
import { useClips } from './queries/clips.ts';
import { isJobRunning } from './queries/jobs.ts';
import { useGuides } from './queries/guides.ts';
import { useSongs } from './queries/songs.ts';

/** The counts of the top bar's tabs. */
export type TabCounts = {
  songCount: number | null;
  clipCount: number | null;
  guideCount: number | null;
  jobCount: number | null;
};

/** How many of these an unfiltered list shows. */
function getShownCount(statuses: Status[]): number {
  return statuses.filter((status) => isShown({ text: '', tags: [], status }, EMPTY_FILTER)).length;
}

/** How many jobs are on their way, or null when none is. */
function getRunningCount(jobs: Job[]): number | null {
  const count = jobs.filter(isJobRunning).length;
  return count > 0 ? count : null;
}

/** The counts of the top bar's tabs, from what the lists read. */
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
