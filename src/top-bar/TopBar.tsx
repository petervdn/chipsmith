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

/** The top bar. */
export function TopBar({ route, jobs }: TopBarProps) {
  const isSongs = route.page === 'songs' || route.page === 'song';
  const isAnyRunning = jobs.some(isJobRunning);
  const { songCount, clipCount, guideCount, jobCount } = useTabCounts(jobs);
  return (
    <header className="top-bar">
      <a href="/" className="top-logo" title="home">
        <Logo size={LOGO_SIZE} />
        <span className="top-logo-name">chipsmith</span>
      </a>
      <nav className="top-nav">
        <a href="/songs" className={`top-link${isSongs ? ' is-on' : ''}`}>
          Songs <span className="top-count">{getCountText(songCount)}</span>
        </a>
        <a href="/clips" className={`top-link${route.page === 'clips' ? ' is-on' : ''}`}>
          Clips <span className="top-count">{getCountText(clipCount)}</span>
        </a>
        <a
          href="/guides"
          className={`top-link${route.page === 'guides' ? ' is-on' : ''}`}
          title="style guides, sent along with a prompt"
        >
          Guides <span className="top-count">{getCountText(guideCount)}</span>
        </a>
        <a
          href="/jobs"
          className={`top-link${route.page === 'jobs' ? ' is-on' : ''}`}
          title={isAnyRunning ? 'a job is on its way' : 'every prompt sent, and what it made'}
        >
          {isAnyRunning && <span className="job-spinner" aria-hidden="true" />}
          Jobs <span className="top-count">{getCountText(jobCount)}</span>
        </a>
      </nav>
      {route.page === 'song' && <SongCrumb songId={route.songId} />}
      <a
        href="/new"
        className={`top-new${route.page === 'new' ? ' is-on' : ''}`}
        title="write a prompt for a new song"
      >
        + New song
      </a>
      <LookSwitcher />
    </header>
  );
}

/** " (12)" after a tab's name, or nothing while its count is not known. */
function getCountText(count: number | null): string {
  return count === null ? '' : `(${count})`;
}

type SongCrumbProps = { songId: string };

/** "› title" of the song open, from the cache the song page reads too. */
function SongCrumb({ songId }: SongCrumbProps) {
  const { data: detail } = useSong(songId);
  return (
    <div className="top-crumb">
      <span className="top-crumb-mark">›</span>
      <span className="top-crumb-title">{detail?.song.title ?? songId}</span>
    </div>
  );
}
