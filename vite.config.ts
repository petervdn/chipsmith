// The dev server: the page from src/, the app's server from server/ (docs/architecture.md). Served on
// the local network so the page can be opened from a phone. CHIPTUNE_DATA points the server at
// another folder of clips/ and songs/ (made-up data, for trying the page).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chiptuneServer } from './server/api.ts';

/** The port the app is served on; the old player (archive branch) still has 8765. */
const PORT = 8780;

export default defineConfig({
  plugins: [react(), chiptuneServer(process.env['CHIPTUNE_DATA'] ?? import.meta.dirname)],
  server: {
    host: true,
    port: PORT,
    strictPort: true,
    watch: { ignored: ['**/clips/**', '**/songs/**', '**/jobs/**', '**/references/**'] },
  },
});
