# src/

The page (React). It asks the server (server/) for clips and songs and shows them; what can be worked
out without the page is in a module of its own beside it, with its test.

- `App.tsx`: the top bar and the page the address is
- `JobCard.tsx`: a job's card on the New page
- `JobStrip.tsx`: one line for a running job, above the songs list
- `FilterBar.tsx`: the filter bar above a list
- `PromptBox.tsx`: the box where a prompt is written and sent
- `PlayButton.tsx`: ▶ for one song, in a list or on its page
- `PlayerBar.tsx`: the player bar at the bottom of every page
- `SongRowDetails.tsx`: a song's row opened: its prompt (copy, prompt again) and details
- `StatusButtons.tsx`: ★ and ✕ for a song's or a clip's status
- `TopBar.tsx`: the bar at the top of every page
- `UndoBar.tsx`: the offer to undo a change that hid something
- `copy-text.ts`: copying text, also where the clipboard API is missing (plain http)
- `format.ts`: how lengths and meters are shown
- `jobs.css`: the look of the prompt box, the job cards and the running count
- `jobs-data.ts`: the jobs, read from the server, and sending a prompt
- `list-filter.ts`: the filter both lists share
- `lists.css`: the look of the lists: filter bar, rows, status buttons
- `main.tsx`: the page's entry
- `pages/`: one file to a page
- `player.css`: the look of ▶ and the player bar
- `playback/`: playing a song: what plays when, the audio, the shared player
- `router.ts`: which page the address is, and moving between them
- `server-api.ts`: reading the server's routes and sending changes
- `style.css`: the colours, the page, the top bar and a song's page, for phone and desktop
- `use-list-filter.ts`: a list's filter kept in the address
