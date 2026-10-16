// The app: the top bar and the page the address is.
import { useState } from 'react';
import { ClipsPage } from './pages/ClipsPage.tsx';
import { SongPage } from './pages/SongPage.tsx';
import { SongsPage } from './pages/SongsPage.tsx';
import { useRoute } from './router.ts';
import { TopBar } from './TopBar.tsx';

/** The whole page. */
export function App() {
  const route = useRoute();
  const [songTitle, setSongTitle] = useState<string | null>(null);
  return (
    <div className="app">
      <TopBar route={route} songTitle={route.page === 'song' ? songTitle : null} />
      <main className="page">
        {route.page === 'songs' && <SongsPage />}
        {route.page === 'clips' && <ClipsPage />}
        {route.page === 'song' && (
          <SongPage key={route.songId} songId={route.songId} onTitle={setSongTitle} />
        )}
      </main>
    </div>
  );
}
