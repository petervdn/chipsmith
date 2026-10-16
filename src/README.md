# src/

The page (React). It asks the server (server/) for clips and songs and shows them; what can be worked
out without the page is in a module of its own beside it, with its test.

- `App.tsx`: the top bar and the page the address is
- `FilterBar.tsx`: the filter bar above a list
- `StatusButtons.tsx`: ★ and ✕ for a song's or a clip's status
- `TopBar.tsx`: the bar at the top of every page
- `format.ts`: how lengths and meters are shown
- `list-filter.ts`: the filter both lists share
- `main.tsx`: the page's entry
- `pages/`: one file to a page
- `router.ts`: which page the address is, and moving between them
- `server-api.ts`: reading the server's routes and sending changes
- `style.css`: the look, for phone and desktop
