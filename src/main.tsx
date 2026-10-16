// The page's entry: mounts the app.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './style.css';
import './lists.css';
import './player.css';
import './jobs.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('no #root in index.html');
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
