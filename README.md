# chipsmith

Chiptune songs made from prompts, and remade a piece at a time. You write what you want; Claude
composes it as [Furnace](https://github.com/tildearrow/furnace) modules; Furnace renders them; the
songs show up in a web app you can listen to from your phone, keep, reject, prompt again or build on.

**The main idea: a song breaks down into parts as fine as you want.** Each part is a clip: a stretch
of bars, one track or several, with its own Furnace file, its own audio and the prompt that made it.
So a song can be prompted again part by part: "make the bass in the second section busier" makes a
new version of just that clip, and the rest of the song stays as it is.

An unofficial tool: it uses Furnace's command line, and is not part of the Furnace project.

## How it works

```
prompt (New page)
  → a job: Claude Code, run headless, writes jobs/<id>/script.ts       (notes/making-songs.md)
  → the script builds one Furnace module per song                      (fur/, make/module-builder.ts)
  → Furnace renders each module, ffmpeg encodes it as FLAC             (render/)
  → each song is a clip in clips/<id>/ and a song in songs/<id>/       (make/make-song.ts)
  → the songs list plays them                                          (src/)
```

- **A song** is an arrangement: tracks of blocks, each block playing a clip at a time.
- **A clip** is one piece of audio, the whole song or a slice of it (bars × channels), with
  everything about it in its own folder: `clip.json` (its prompt, slice, tags, status), its own
  `source.fur`, the script that wrote it, and `audio.flac`. Clips never change: a change is a new
  clip whose parent is the old one, so every part keeps its history of prompts.
- **A new song starts as one whole clip** and is split into sections and tracks when you work on it,
  as far as you want (docs/adr/0010).
- **The files are the data**: `clips/` and `songs/` hold JSON the server reads into memory when it
  starts. There is no database.

**Where it stands:** making songs from prompts, listening, keeping, rejecting, prompting again and
building on a song work. Splitting a song into parts and prompting a part again come with the song
editor, which is next.

How it is built and why: [docs/architecture.md](docs/architecture.md), the decisions in
[docs/adr/](docs/adr/README.md), the rules code is written by in
[docs/code-guidelines.md](docs/code-guidelines.md).

## What it needs

macOS (Furnace is called as the installed app), and:

| Program | Used for | Found at, unless set (below) |
|---|---|---|
| Node 24 or later | the app, the tools, job scripts (runs TypeScript as it is) | the Node running the server |
| [Furnace](https://github.com/tildearrow/furnace) 0.6.8.3 | rendering a module to audio | `/Applications/Furnace.app/Contents/MacOS/Furnace` |
| ffmpeg | encoding the renders as FLAC | `ffmpeg` on the PATH (`brew install ffmpeg`) |
| [Claude Code](https://claude.com/claude-code) | composing songs from prompts | `~/.local/bin/claude`, else `claude` on the PATH |

Claude Code must be logged in for jobs to compose: run `claude`, then `/login`. A job that cannot log
in fails with that reason on its card.

## Running it

```bash
npm install
npm run dev
```

The app is served on port 8780, also on the local network (open it on a phone with the computer's
address, e.g. `http://192.168.x.x:8780`).

### Settings

All settings are read in one place, [config/settings.ts](config/settings.ts). Each is an environment
variable, or a line in a `.env` file in the project folder (copy [.env.example](.env.example); `.env`
is not in git). A variable set in the shell wins over the file; what is not set has its default.

| Variable | What it changes | Default |
|---|---|---|
| `CHIPSMITH_DATA` | the folder holding `clips/`, `songs/` and `jobs/` | the project folder |
| `CHIPSMITH_PORT` | the port the app is served on | `8780` |
| `CHIPSMITH_ARCHIVE` | the old project's checkout | `../chiptune-archive` |
| `CHIPSMITH_FURNACE` | the Furnace binary | the app in `/Applications` |
| `CHIPSMITH_FFMPEG` | the ffmpeg binary | `ffmpeg` |
| `CHIPSMITH_CLAUDE` | the Claude Code binary | `~/.local/bin/claude`, else `claude` |
| `CHIPSMITH_NODE` | the Node that runs a job's script | the Node running the server |

When the server starts it checks each program: it runs it, reads its version (the Furnace version is
what each clip records as rendered by), and logs what cannot be used. The page then shows a bar naming
what is missing, what it is needed for and which setting to change, with "Check again".

## Audio and git

`clips/*/audio.flac` is not in git: it is rendered from the clip's `source.fur`. A fresh checkout has
the songs but no audio; rendering missing audio again is not built yet (docs/adr/0011).

## Tools

| Command | What it does |
|---|---|
| `npm run check` | types, lint, tests and formatting; passes before every commit |
| `node fur/dump.ts <file.fur> [--ins] [--pat CHANNEL,ORDER]` | a module as text |
| `node make/check-script.ts <script.ts>` | builds and renders a song script: length, peak, gain per song |
| `node make/import-archive.ts --favorites` | imports the old project's favourites (needs `../chiptune-archive`) |
| `node fur/check-archive.ts` | checks the .fur writer against every module of the old project |

## The old project

The branch `archive` is this project before its restart on 2026-10-16: Python tools writing batches
of Furnace files, a separate player and a song editor. Its audio is not in git.
