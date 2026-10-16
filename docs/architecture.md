# Architecture

How the app is built. Why each choice was made is in docs/adr/; the rules code is written by are in
docs/code-guidelines.md.

## The model

- **A song** is an arrangement: tracks, each a row of blocks. A block places a clip at a time on the
  song's grid (ticks, `TICKS_PER_BEAT` to a beat), with an optional trim and a number of repeats.
- **A clip** is one piece of audio: a whole piece, or a slice of it by bars and chip channels. Every
  clip is the same kind of thing, however it was cut. It holds all of its own information (0004):
  prompt, slice, name, parent, tags, status, facts, and its own .fur and script.
- Clips are one shared pool (0005); a song points to clips by id. A clip's audio and source never
  change: a change is a new clip whose parent is the old one (`variation`), and a cut is new clips
  whose parent is the whole one (`split`). Which songs use a clip is worked out, not stored.
- Songs and clips have tags (descriptions) and a status: new, heard, keeper, rejected (0009).

The types are in `shared/clip.types.ts` and `shared/song.types.ts`.

## The files

```
clips/<id>/clip.json      a clip's information (shared/clip.types.ts)
clips/<id>/audio.flac     its audio (not in git, rendered again from source.fur: 0011)
clips/<id>/source.fur     its own Furnace module
clips/<id>/script.ts      its own copy of the script that wrote it
songs/<id>/song.json      a song's arrangement (shared/song.types.ts)
```

The files are the data (0006). Ids are a letter and a number: `c0001` for clips, `s0001` for songs.

## The server

`server/`, run inside Vite's dev server as a plugin (`server/api.ts`). When it starts it reads every
clip.json and song.json into memory (`server/store.ts`); a file that does not fit is reported and
left alone. A change is written to its file, then to the copy in memory.

Routes: `GET /api/songs`, `GET /api/songs/<id>`, `PATCH /api/songs/<id>` (status, tags),
`GET /api/clips`, `PATCH /api/clips/<id>`, and `GET /media/clips/<id>/audio.flac` with byte ranges.
What they answer is typed in `shared/api.types.ts`.

## The pages

`src/`, React (0013). One top bar on every page: Songs | Clips, and in a song the song's title.

- **Songs** (`/`): every song, with the filter bar (words, tags, rejected or not), its facts and ★ / ✕.
- **Song** (`/songs/<id>`): the song opened. Now: its tracks and the clips they play. To come: the
  timeline, playback, the selected block's clip with its prompt and versions, a prompt box.
- **Clips** (`/clips`): the pool, with the same filter bar.

The page is laid out for a phone first (one column, rows that wrap, 40 px touch targets) and a
desktop (rows on one line), in `src/style.css`.

## Tooling

- Vite + TypeScript, strict (0012). `npm run dev` serves on port 8780, on the local network too. The
  old player (branch `archive`, run from `../chiptune-archive/player`) keeps port 8765 until the new
  app replaces it.
- `npm test`: Node's own runner reads the TypeScript as it is. Imports name their file with its
  extension (`./store.ts`), so Vite, Node and the tests resolve them alike. `test/layout.test.ts` holds the source's map (a README in
  every folder, a comment at the head of every file, no file over 400 lines).
- `npm run lint`: oxlint. `npm run format`: Prettier. `npm run check`: all of them and the types.

## Still to build

1. The .fur writer, reader and dump in TypeScript, checked byte for byte against the Python on
   `archive` (0002).
2. Rendering a clip to FLAC without starting the Furnace app. The app's binary with `-output` still
   starts the whole app (its CoreMIDI client failing after many quick launches was a side effect).
   First look: a console-only build of Furnace from source, without its GUI (unverified).
3. Making songs from a prompt: a Claude job writes a script, the script writes .fur files, each is
   rendered, and clips and songs are written.
4. Playback (Web Audio, blocks scheduled on the audio clock) and the song editor.
5. Cutting a whole clip into sections and stems (0010), and versions of a clip (0014).
