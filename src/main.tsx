// The page's entry: mounts the app inside the query client's provider.
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { queryClient } from './queries/client.ts';
import './style.css';
import './lists/lists.css';
import './player/player.css';
import './jobs/jobs.css';
import './guides/guides.css';
import './home/home.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('no #root in index.html');
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
