// The bar at the top of every page: Songs, Clips and New (with how many jobs are on their way), the
// one open marked, and in a song the song's title.
import type { Job } from '../shared/job.types.ts';
import { isJobRunning } from './jobs-data.ts';
import type { Route } from './router.ts';

type TopBarProps = { route: Route; songTitle: string | null; jobs: Job[] };

/** The top bar. */
export function TopBar({ route, songTitle, jobs }: TopBarProps) {
  const isSongs = route.page === 'songs' || route.page === 'song';
  const runningCount = jobs.filter(isJobRunning).length;
  return (
    <header className="top-bar">
      <nav className="top-nav">
        <a href="/" className={`top-link${isSongs ? ' is-on' : ''}`}>
          Songs
        </a>
        <a href="/clips" className={`top-link${route.page === 'clips' ? ' is-on' : ''}`}>
          Clips
        </a>
        <a
          href="/new"
          className={`top-link${route.page === 'new' ? ' is-on' : ''}`}
          title={runningCount > 0 ? `${runningCount} on its way` : 'ask Claude for new songs'}
        >
          New
          {runningCount > 0 && <span className="top-badge">{runningCount}</span>}
        </a>
      </nav>
      {route.page === 'song' && (
        <div className="top-crumb">
          <span className="top-crumb-mark">›</span>
          <span className="top-crumb-title">{songTitle ?? route.songId}</span>
        </div>
      )}
    </header>
  );
}
