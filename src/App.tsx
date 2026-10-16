// The app: the top bar and the page the address is.
import { useState } from 'react';
import { useJobs } from './jobs-data.ts';
import { ClipsPage } from './pages/ClipsPage.tsx';
import { SongPage } from './pages/SongPage.tsx';
import { SongsPage } from './pages/SongsPage.tsx';
import { useRoute } from './router.ts';
import { PlayerBar } from './PlayerBar.tsx';
import { TopBar } from './TopBar.tsx';

/** The whole page. */
export function App() {
  const route = useRoute();
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const { jobs, refresh } = useJobs();
  return (
    <div className="app">
      <TopBar route={route} songTitle={route.page === 'song' ? songTitle : null} jobs={jobs} />
      <main className="page">
        {route.page === 'songs' && <SongsPage jobs={jobs} onPromptSent={refresh} />}
        {route.page === 'clips' && <ClipsPage />}
        {route.page === 'song' && (
          <SongPage key={route.songId} songId={route.songId} onTitle={setSongTitle} />
        )}
      </main>
      <PlayerBar />
    </div>
  );
}
