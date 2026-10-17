// The bar at the top of every page: the logo (home), Songs, Clips, Guides and Jobs with how many each
// holds (Jobs: how many are on their way; the one open marked, Jobs turning while one runs), in a song the song's title, a button for
// a new song at the right, and the switch between light and dark.
import type { Job } from '../../shared/job.types.ts';
import { Logo } from './Logo.tsx';
import { LookSwitcher } from './LookSwitcher.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import { useSong } from '../queries/songs.ts';
import { useTabCounts } from './use-tab-counts.ts';
import type { Route } from '../router.ts';
import '../jobs/jobs.css';
import './TopBar.css';

const LOGO_SIZE = 32;

type TopBarProps = { route: Route; jobs: Job[] };

/**
 * Shows the top bar.
 *
 * @param props - The component's props.
 * @param props.route - The page open, whose tab is marked (and, in a song, whose title is shown).
 * @param props.jobs - Every job, for the Jobs tab's count and whether it turns.
 * @returns The top bar's header element.
 */
export function TopBar({ route, jobs }: TopBarProps) {
  const isSongs = route.page === 'songs' || route.page === 'song';
  const isAnyRunning = jobs.some(isJobRunning);
  const { songCount, clipCount, guideCount, jobCount } = useTabCounts(jobs);
  return (
    <header className="top-bar">
      <a href="/" className="top-bar-logo" title="home">
        <Logo size={LOGO_SIZE} />
        <span className="top-bar-logo-name">chipsmith</span>
      </a>
      <nav className="top-bar-nav">
        <a href="/songs" className={`top-bar-link${isSongs ? ' is-on' : ''}`}>
          Songs <span className="top-bar-count">{getCountText(songCount)}</span>
        </a>
        <a href="/clips" className={`top-bar-link${route.page === 'clips' ? ' is-on' : ''}`}>
          Clips <span className="top-bar-count">{getCountText(clipCount)}</span>
        </a>
        <a
          href="/guides"
          className={`top-bar-link${route.page === 'guides' ? ' is-on' : ''}`}
          title="style guides, sent along with a prompt"
        >
          Guides <span className="top-bar-count">{getCountText(guideCount)}</span>
        </a>
        <a
          href="/jobs"
          className={`top-bar-link${route.page === 'jobs' ? ' is-on' : ''}`}
          title={isAnyRunning ? 'a job is on its way' : 'every prompt sent, and what it made'}
        >
          {isAnyRunning && <span className="jobs-spinner" aria-hidden="true" />}
          Jobs <span className="top-bar-count">{getCountText(jobCount)}</span>
        </a>
      </nav>
      {route.page === 'song' && <SongCrumb songId={route.songId} />}
      <a
        href="/new"
        className={`top-bar-new${route.page === 'new' ? ' is-on' : ''}`}
        title="write a prompt for a new song"
      >
        + New song
      </a>
      <LookSwitcher />
    </header>
  );
}

/**
 * Returns the count shown after a tab's name, such as "(12)".
 *
 * @param count - The tab's count, or null while it is not known.
 * @returns The count in brackets, or an empty string while it is not known.
 */
function getCountText(count: number | null): string {
  return count === null ? '' : `(${count})`;
}

type SongCrumbProps = { songId: string };

/**
 * Shows "› title" of the song open, from the cache the song page reads too.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song open, shown until its title has been read.
 * @returns The crumb's element.
 */
function SongCrumb({ songId }: SongCrumbProps) {
  const { data: detail } = useSong(songId);
  return (
    <div className="top-bar-crumb">
      <span className="top-bar-crumb-mark">›</span>
      <span className="top-bar-crumb-title">{detail?.song.title ?? songId}</span>
    </div>
  );
}
