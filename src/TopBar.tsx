// The bar at the top of every page: the app's two lists, Songs and Clips, the one open marked, in a
// song the way back to the list it is in, and how many jobs are running (a link to them).
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
      </nav>
      {route.page === 'song' && (
        <div className="top-crumb">
          <span className="top-crumb-mark">›</span>
          <span className="top-crumb-title">{songTitle ?? route.songId}</span>
        </div>
      )}
      {runningCount > 0 && (
        <a
          href="/"
          className="top-running"
          title="jobs on their way: see them at the top of the songs list"
        >
          <span className="job-spinner" aria-hidden="true" />
          {runningCount} running
        </a>
      )}
    </header>
  );
}
