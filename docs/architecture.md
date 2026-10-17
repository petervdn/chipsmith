# Architecture

How the app is built. Why each choice was made is in docs/adr/; the rules code is written by are in
docs/code-guidelines.md.

## The model

- **A song** is an arrangement (tracks, each a row of blocks) and the prompt it was made from. A block places a clip at a time on the
  song's grid (ticks, `TICKS_PER_BEAT` to a beat), with an optional trim and a number of repeats.
- **A clip** is one piece of audio: a whole piece, or a slice of it by bars and chip channels. Every
  clip is the same kind of thing, however it was cut. It holds all of its own information (0004):
  in clip.json its record (prompt, slice, name, parent, tags, status, the Furnace that rendered it),
  and its own .fur and script. Its facts (tempo, beats, chips, the channels that play, its length)
  are read from its .fur when it is read, never stored (0024).
- Clips are one shared pool (0005); a song points to clips by id. A clip's audio and source never
  change: a change is a new clip whose parent is the old one (`variation`), and a cut is new clips
  whose parent is the whole one (`split`). Which songs use a clip is worked out, not stored.
- Songs and clips have tags (descriptions) and a status: new, heard, keeper (0009). A song not
  wanted is deleted, with the clips no other song plays (0028).
- A song keeps the prompt it was made from (`prompt`, never changed; 0016); its clips keep their own.
  "Prompt again" on a song's row sends only the song's prompt; the new songs note the song
  (`promptedFrom`). A song whose clips were made by other prompts shows as changed after its prompt.
- "Use as base" on a song's row opens New with `Based on <title> [<id>]: `; the composing Claude reads
  that song's files and starts from its music (the furnace-song skill). Nothing else is stored.

The types are in `shared/clip.types.ts` and `shared/song.types.ts`.

## The files

```
clips/<id>/clip.json      a clip's record (shared/clip.types.ts); its facts are read from source.fur
clips/<id>/audio.flac     its audio (rendered from source.fur when the server starts, if missing)
clips/<id>/source.fur     its own Furnace file
clips/<id>/script.ts      its own copy of the script that wrote it
songs/<id>/song.json      a song's arrangement (shared/song.types.ts)
guides/<id>/guide.json    a style guide (shared/guide.types.ts), sent with a prompt when chosen
structures/<id>/structure.json  a song structure (shared/structure.types.ts), sent with a prompt when chosen
```

The files are the data (0006). Ids are a letter and a number: `c0001` for clips, `s0001` for songs.
They are in the data folder (`data/` unless set), which is never in git (0018), with `jobs/`.
`examples/` (in git) holds five songs and their clips, copied into a data folder that has none.

## The server

`server/`, run inside Vite's dev server as a plugin (`server/api.ts`). When it starts it copies the
examples into an empty data folder (`server/examples.ts`), reads every clip.json (with the facts
of the source.fur beside it) and song.json into memory (`server/store.ts`; a file that does not fit
is reported and left alone), and renders, one at a time in the background, every clip that has a
source.fur and no audio.flac, recording the Furnace that rendered it (`server/missing-audio.ts`);
a song waiting for its audio shows … for ▶ and its list is read again until it has it. A change is written to its file, then to the copy in memory.

Routes: `GET /api/songs`, `GET /api/songs/<id>`, `PATCH /api/songs/<id>` (status, tags),
`DELETE /api/songs/<id>` (with the clips only it played), `PUT /api/songs/<id>/tracks` (the
arrangement, saved from the editor), `POST /api/songs/<id>/split`, `GET /api/clips`, `PATCH /api/clips/<id>`, and `GET /media/clips/<id>/audio.flac` with byte ranges.
What they answer is typed in `shared/api.types.ts`.

## The pages

`src/`, React (0013), a folder per area (a page, the top bar, the player, the lists; 0020). One top bar on every page: the logo (home), Songs | Clips | Guides | Jobs, each with how many it
holds (Jobs turning while one runs), and at the right + New song (an action, not a section). Every
page but Home starts with breadcrumbs, the last its heading (Songs › Seven Teeth).

- **Home** (`/`): the logo and what the app is, a + New song button, the running jobs, how many songs
  there are (kept, not heard yet) and the five made last with ▶.
- **Songs** (`/songs`): every song, with the filter bar (words, tags), its facts, ▶, ★, a trash can
  (asked first), and ⌄ to open the row: its prompt (copy, prompt again), its facts and its prompt links.
- **Song** (`/songs/<id>`): the song opened in the editor (`src/editor/`): a timeline of its tracks
  (a ruler of bars, each block drawn as the slice of its clip's waveform it plays, repeats after it,
  a playhead), ▶ / ❚❚ from a cursor set on the ruler and ■ back to it, zoom, the song's clips in a
  column at its left (each with its blocks counted; tapped, its first block is selected; folded to a
  strip, and on a phone folded at first and laid over the timeline when open), the page using the
  whole width, and the selected block's
  clip with its prompt and versions. Editing (0022): drag a block to move it (to another track too),
  its edges to trim it, drag a clip from the song's clips onto a track as a new block, snapped to a grid; repeat, duplicate, untrim, remove; add, rename and remove tracks; mute
  and solo (not saved); undo and redo; Save or Revert. Split into channels (a song that is one whole clip
  of more than one channel; what cutting does to the sound: docs/splitting.md): a track per channel
  that plays, each one block of a new clip, the whole song on that channel alone, rendered in the
  background and shown striped until its audio is in (`fur/cut.ts`, `make/split-song.ts`,
  `POST /api/songs/<id>/split`). To come: a prompt on the selection.
- **Clips** (`/clips`): the pool, with the same filter bar.
- **Guides** (`/guides`): the style guides, made, edited and deleted.
- **New** (`/new`): a prompt for Claude in a box, a prompt builder under it (the chips as switches, one or more; a part per row, rolled
  at random or picked, each with a lock, the sentence they make on top; "Use" fills the box, which is otherwise its own),
  the Structure panel (AABA chosen at first; none, a preset, a saved structure or your own: written short and as tiles
  as wide as their bars, a section edited when tapped, saved as new or over a saved one; 0023), and
  the Harmony panel (everything Claude's choice at first: the key and mode, the kind and colour of
  the chords, how often they change, the bass, the cadences, a key change, each a row with a die and
  a lock; how strictly; a progression per part of the structure, or one for the whole song: a
  preset of the mode, made up at random from the settings (`progression-generator.ts`), or your
  own, as tiles of Roman numerals named in the key and written short, `i ♭VI V:½`), and the style
  guides as chips to send with it (their texts readable in place). Sending it leads to Jobs.
- **Jobs** (`/jobs`): every prompt sent, as a card, newest first; one that is over can be removed
  (✕; `removed` in its job.json, its files kept). The tab counts the jobs on their way.

The page is light or dark: as the system is set, until the top bar's ☾ / ☀ switches it (`src/top-bar/looks.ts`,
the colours in `src/style.css`), kept in the preferences. The accent is a bright lime.

Nothing pops up from the browser (0026): a question before a change is the page's own dialog
(`src/dialog/`, asked through `src/stores/confirm-store.ts`), over a see-through black backdrop, and
a tooltip is the page's own (`src/tooltip/`), a control's `data-tooltip` shown when the mouse rests
on it or the keyboard moves to it.

The page is laid out for a phone first (one column, rows that wrap, controls 32 px tall, 36 px under a finger) and a
desktop (rows on one line), in `src/style.css`.

## State in the page

Where state lives follows 0017: local first, lifted, context for a subtree, a Zustand store when it is
the app's. Everything from the server is TanStack Query (`src/queries/`: songs, a song, clips, jobs
polled while one runs, and the mutations), its keys from `getQueryKey({ type })`. The stores
(`src/stores/`): the player (not persisted) and preferences (mute, the look; localStorage,
through Zustand's persist); no component touches storage. A list's filter is in the address only: the
top bar's links open a list unfiltered, and the back button returns to a filtered one.

## Tooling

- Settings (data folder, port, the programs called: Furnace, ffmpeg, Claude Code, Node) are read in one place, `config/settings.ts`: `CHIPSMITH_…` variables over a `.env` file over
  the defaults (README.md, "Settings"). `config/programs.ts` checks the programs when the server
  starts (each run once for its version; `GET`/`POST /api/programs`); a missing one shows as a bar on
  every page (`src/ProgramWarning.tsx`). Clips record the Furnace version read from Furnace itself.
- Vite + TypeScript, strict (0012). `npm run dev` serves on port 6502, on the local network too.
- `npm test`: Node's own runner reads the TypeScript as it is. Imports name their file with its
  extension (`./store.ts`), so Vite, Node and the tests resolve them alike. `test/layout.test.ts` holds the source's map (a README in
  every folder, a comment at the head of every file, no file over 400 lines).
- `npm run lint`: oxlint. `npm run format`: Prettier. `npm run check`: all of them and the types.

## The .fur files

`fur/` writes and reads Furnace files (.fur) as this project writes them (format version 223, old INFO
layout, one subsong, NES / SCC / SCC+ / SID): `write.ts` lays a file out as Furnace does, `read.ts` reads
one back, `instrument.ts` and `pattern.ts` build the blocks, `dump.ts` shows a .fur file as text. It is
the port of the Python tools (0002), held to them by `fur/round-trip.test.ts`: the examples' .fur files,
whose patterns and instruments the Python writer made, are read and written again byte for byte. (Before the old project left
git, all 1,534 of its .fur files were checked so.)

## Rendering and making songs

- `render/`: a clip's source.fur rendered by the Furnace app's command line to a WAV, one at a time,
  retried after a pause if it fails (0015), encoded as audio.flac with ffmpeg.
- `make/`: new songs on disk. `make-song.ts` makes a song of one whole clip from a .fur file: claims the
  ids (`ids.ts`, by making the folders), writes the clip's source.fur and script, renders its audio,
  writes clip.json and song.json, and the server is told to look again (`POST /api/rescan`).

## Playback

`src/playback/`: `schedule.ts` turns a song's blocks into stretches of clips' audio in seconds;
`audio-engine.ts` plays them with Web Audio, each on the audio clock, loading a few clips at a time.
The player's state is a Zustand store (`src/stores/player-store.ts`). The player bar
(`src/player/PlayerBar.tsx`) sits at the bottom of every page: ▶ / ■ (the share loaded while loading), the
title, a slider to move in the song, and a mute switch for testing (the preferences store). Every song
row and song page has ▶.

## Prompts and jobs

A prompt is written on the New page (`/new`), with the style guides chosen as chips (the default ones
to start with; nothing is carried over from another song), and becomes a job (`server/jobs.ts`,
`jobs/<id>/job.json`, out of git) the moment it arrives. The chosen guides (`server/guides.ts`) are
copied into the job, given to Claude as part of the prompt, and copied into every song and clip it
makes (`guides` beside `prompt`), so a later change to a guide does not change what they were made
from (0019); so are the structure and the harmony chosen with it (`structure`, `harmony`), which
Claude gets as lines of its prompt (`shared/structure-prompt.ts`, `shared/harmony-prompt.ts`). Its
card shows on the Jobs page; a running job also has one line above the songs list and on the
home page, and the Jobs tab turns while one runs. The runner (`server/job-runner.ts`) takes one job at a time through its
phases:
1. **composing**: Claude Code runs headless (`server/claude-run.ts`: `claude -p`, detached, its
   stream written to `jobs/<id>/claude.log`). It follows the write-song skill (`.claude/skills/`) and writes
   `jobs/<id>/script.ts`, whose default export gives a plan per song (`make/song-plan.ts`), its music
   made with `make/fur-file-builder.ts`; it checks them with `make/check-script.ts`. Its lines and what
   its tools do are read from the log every second (`server/claude-log.ts`) and become the job's
   notes; what it is in the middle of (thinking, a line or a file being written, from the streamed
   partial messages) is the card's "now" line.
2. **building**: `make/build-script.ts` runs the script in a process of its own and writes a .fur per
   song; the card lists the songs.
3. **rendering**: each song is made and rendered in turn (`make/make-song.ts`) and shows in the list as
   soon as it is done.
4. **done** with Claude's reply, or **failed** with the reason.

## Still to build

1. A prompt on the editor's selection, its new clips replacing the blocks, with versions (0014).
2. A song's sections labelled on the timeline, as written and never changed:
   - A song's script also returns the sections it wrote (`A 8, A′ 8, B 4 (breakdown), A 8`), with
     or without a structure sent; `make/check-script.ts` checks they add up to the song's length.
   - They are kept on the whole clip (`sections` in its record), like its prompt: a clip never
     changes, so neither do they. Clips split from it cover the same bars and keep them.
   - The timeline draws them in a thin lane above the tracks, where the clip's block plays: moved
     with the block, cut by its trim.
   - A song made before, with a structure but no sections, shows the structure it was sent, marked
     as asked rather than written; one with neither shows none.
   - Why not draw the structure sent: Claude may not follow its bars exactly, songs without one get
     nothing, and labels pinned to the timeline stay put when blocks move.
3. Rethink what clips are for. The pool is shared (0005) so a clip can play in more than one song,
   but no song shares one: the Clips page is a long flat list of clips each played by one song,
   and some by none. To weigh: keep `clips/` on disk but drop Clips from the top bar (a song's
   clips are in its editor), or group the page by song; clean up the clips no song plays; reuse
   across songs, if wanted, as a picker in the editor's clip column. The outcome is an ADR beside 0005.
