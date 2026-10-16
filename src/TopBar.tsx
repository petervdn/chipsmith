// The bar at the top of every page: the app's two lists, Songs and Clips, the one open marked, and
// in a song the way back to the list it is in.
import type { Route } from './router.ts';

type TopBarProps = { route: Route; songTitle: string | null };

/** The top bar. */
export function TopBar({ route, songTitle }: TopBarProps) {
  const isSongs = route.page === 'songs' || route.page === 'song';
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
    </header>
  );
}
