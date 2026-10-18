# src/songs/

The songs list and a song opened.

- `header/`: a song's header on its page: its facts, its prompt and what it was sent with
- `SongPage.css`: the look of SongPage.tsx
- `SongPage.tsx`: one song, opened
- `SongPrompt.css`: the look of SongPrompt.tsx
- `SongPrompt.tsx`: a song's prompt on its page, cut to a few lines until opened, with copy
- `SongRowDetails.css`: the look of SongRowDetails.tsx
- `SongRowDetails.tsx`: a song's row opened: its prompt (copy, prompt again) and details
- `SongsPage.css`: the look of SongsPage.tsx
- `SongsPage.tsx`: the songs list, all of them or only the favorites
- `SongsTabs.css`: the look of SongsTabs.tsx
- `SongsTabs.tsx`: the tabs over the songs list: All and Favorites
- `use-stop-on-open.ts`: what plays stopped when a song's page opens, unless it is that song
- `use-copy-text.ts`: copying a text from a button, and whether the last copy worked
