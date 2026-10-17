// The app: the top bar, a warning when a program it calls is missing, the page the address is, and
// the player bar.
import { ClipsPage } from './clips/ClipsPage.tsx';
import { GuidesPage } from './guides/GuidesPage.tsx';
import { HomePage } from './home/HomePage.tsx';
import { JobsPage } from './jobs/JobsPage.tsx';
import { NewPage } from './new-song/NewPage.tsx';
import { SongPage } from './songs/SongPage.tsx';
import { SongsPage } from './songs/SongsPage.tsx';
import { PlayerBar } from './player/PlayerBar.tsx';
import { ProgramWarning } from './ProgramWarning.tsx';
import { useJobs } from './queries/jobs.ts';
import { useRoute } from './router.ts';
import { TopBar } from './top-bar/TopBar.tsx';

/**
 * Shows the whole page: the top bar, the program warning, the page the address is, and the player
 * bar.
 *
 * @returns The app's element.
 */
export function App() {
  const route = useRoute();
  const jobs = useJobs();
  return (
    <div className="app">
      <TopBar route={route} jobs={jobs} />
      <ProgramWarning />
      <main className="page">
        {route.page === 'home' && <HomePage jobs={jobs} />}
        {route.page === 'songs' && <SongsPage jobs={jobs} />}
        {route.page === 'clips' && <ClipsPage />}
        {route.page === 'guides' && <GuidesPage />}
        {route.page === 'new' && <NewPage />}
        {route.page === 'jobs' && <JobsPage jobs={jobs} />}
        {route.page === 'song' && <SongPage key={route.songId} songId={route.songId} />}
      </main>
      <PlayerBar />
    </div>
  );
}
