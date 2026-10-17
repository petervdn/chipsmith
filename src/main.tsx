// The page's entry: the base styles first, then the app inside the query client's provider; each
// component brings its own styles.
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { App } from './App.tsx';
import { queryClient } from './queries/client.ts';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('no #root in index.html');
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
