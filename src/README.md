# src/

The page (React), a folder per area of the app (docs/code-guidelines.md, "The page's folders"):
each holds its components, their CSS, hooks, and the modules that know no page with their tests.
At the top: the app's shell and what every area uses.

- `App.tsx`: the top bar and the page the address is
- `Breadcrumbs.css`: the look of Breadcrumbs.tsx
- `Breadcrumbs.tsx`: the trail at the head of a page, its last crumb the page's heading
- `clips/`: the clip pool
- `copy-text.ts`: copying text, also where the clipboard API is missing (plain http)
- `dialog/`: the page's own dialogs, in place of the browser's
- `editor/`: the song editor: the timeline, playing from a cursor, the selected block
- `format.ts`: how lengths, meters and tokens are shown
- `guides/`: the style guides, their page and their chips
- `home/`: the home page
- `jobs/`: the jobs page, a job's card and its line
- `lists/`: what the songs and clips lists share
- `main.tsx`: the page's entry
- `new-song/`: the New page and its prompt box
- `playback/`: playing a song: what plays when, the audio, the shared player
- `player/`: ▶ and the player bar
- `ProgramWarning.css`: the look of ProgramWarning.tsx
- `ProgramWarning.tsx`: a bar when a program the app calls is missing
- `queries/`: everything read from or sent to the server (TanStack Query)
- `references/`: Furnace's demo songs to listen to, channel by channel, with the user's notes
- `router.ts`: which page the address is, and moving between them
- `songs/`: the songs list and a song opened
- `stores/`: Zustand stores: the player, the preferences and the confirm question
- `style.css`: the base: the colour tokens, the page, links, form controls and the shell
- `tooltip/`: the page's own tooltip, in place of the browser's
- `top-bar/`: the bar at the top of every page
- `use-page-title.ts`: the browser tab's title, the page's name and then chipsmith
