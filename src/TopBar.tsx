// The bar at the top of every page: the logo (home), Songs, Clips and Guides (the one open marked),
// in a song the song's title, a button for a new song at the right (with how many jobs are on their
// way), and the looks to try.
import type { Job } from '../shared/job.types.ts';
import { Logo } from './Logo.tsx';
import { LookSwitcher } from './LookSwitcher.tsx';
import { isJobRunning } from './queries/jobs.ts';
import { useSong } from './queries/songs.ts';
import type { Route } from './router.ts';

const LOGO_SIZE = 32;

type TopBarProps = { route: Route; jobs: Job[] };

/** The top bar. */
export function TopBar({ route, jobs }: TopBarProps) {
  const isSongs = route.page === 'songs' || route.page === 'song';
  const runningCount = jobs.filter(isJobRunning).length;
  return (
    <header className="top-bar">
      <a href="/" className="top-logo" title="home">
        <Logo size={LOGO_SIZE} />
        <span className="top-logo-name">chipsmith</span>
      </a>
      <nav className="top-nav">
        <a href="/songs" className={`top-link${isSongs ? ' is-on' : ''}`}>
          Songs
        </a>
        <a href="/clips" className={`top-link${route.page === 'clips' ? ' is-on' : ''}`}>
          Clips
        </a>
        <a
          href="/guides"
          className={`top-link${route.page === 'guides' ? ' is-on' : ''}`}
          title="style guides, sent along with a prompt"
        >
          Guides
        </a>
      </nav>
      {route.page === 'song' && <SongCrumb songId={route.songId} />}
      <a
        href="/new"
        className={`top-new${route.page === 'new' ? ' is-on' : ''}`}
        title={runningCount > 0 ? `${runningCount} on its way` : 'write a prompt for a new song'}
      >
        + New song
        {runningCount > 0 && <span className="top-badge">{runningCount}</span>}
      </a>
      <LookSwitcher />
    </header>
  );
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
