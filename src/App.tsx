// The app: the top bar, a warning when a program it calls is missing, the page the address is, and
// the player bar.
import { ClipsPage } from './pages/ClipsPage.tsx';
import { GuidesPage } from './pages/GuidesPage.tsx';
import { NewPage } from './pages/NewPage.tsx';
import { SongPage } from './pages/SongPage.tsx';
import { SongsPage } from './pages/SongsPage.tsx';
import { PlayerBar } from './PlayerBar.tsx';
import { ProgramWarning } from './ProgramWarning.tsx';
import { useJobs } from './queries/jobs.ts';
import { useRoute } from './router.ts';
import { TopBar } from './TopBar.tsx';

/** The whole page. */
export function App() {
  const route = useRoute();
  const jobs = useJobs();
  return (
    <div className="app">
      <TopBar route={route} jobs={jobs} />
      <ProgramWarning />
      <main className="page">
        {route.page === 'songs' && <SongsPage jobs={jobs} />}
        {route.page === 'clips' && <ClipsPage />}
        {route.page === 'guides' && <GuidesPage />}
        {route.page === 'new' && <NewPage jobs={jobs} />}
        {route.page === 'song' && <SongPage key={route.songId} songId={route.songId} />}
      </main>
      <PlayerBar />
    </div>
  );
}
