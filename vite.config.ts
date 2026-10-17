// The dev server: the page from src/, the app's server from server/ (docs/architecture.md). Served on
// the local network so the page can be opened from a phone. Port and data folder: config/settings.ts.
// What is made (the data folder) and what is only read (examples, references) is not watched.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getSettings } from './config/settings.ts';
import { chiptuneServer } from './server/api.ts';

const { port, dataFolder } = getSettings();

export default defineConfig({
  plugins: [react(), chiptuneServer(dataFolder)],
  server: {
    host: true,
    port,
    strictPort: true,
    watch: {
      ignored: [dataFolder, 'examples', 'references'].map(
        (folder) => `${resolve(import.meta.dirname, folder)}/**`,
      ),
    },
  },
});
