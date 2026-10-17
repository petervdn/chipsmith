# chipsmith

An app for making chiptune songs (NES, Konami SCC+) from prompts. Claude composes in code and renders
audio but **cannot hear it**: the user's listening feedback is ground truth, and when they describe a
problem, fix the actual cause rather than working around it.

## How it is built

How the app is built (the model of songs and clips, the files, the server, the pages, what is still
to build):

@docs/architecture.md

The rules code is written by. Follow them, and change the file when a rule changes:

@docs/code-guidelines.md

When a decision is made between real alternatives, record it and why in `docs/adr/` (see its README
for the format and the list). A decision made in a conversation is not done until its ADR is written.

- **Words**: a **song** is an arrangement of **tracks** of **blocks**; a block plays a **clip**. A clip
  is any piece of audio, whole or cut by bars and chip **channels** (a channel is only ever the
  chip's).
- **A clip never changes** once made, and holds all of its own information. A change is a new clip.
- **What is made is never in git**: songs, clips, jobs and style guides are in the data folder
  (`data/`, docs/adr/0018). The repository holds the app and five example songs (`examples/`), and no
  one's name, prompts or taste.
- **`npm run check`** (types, lint, tests, formatting) passes before a commit, and a change is
  committed when it is done, one subject to a commit (docs/code-guidelines.md, "Commits").
- **The app**: `npm run dev`, port 6502, on the local network too.
- Test the page silently: switch on the player bar's mute (or set localStorage `chiptune.mute` to
  `"1"`) before playing anything in the browser.

## Where the knowledge is

- The skills (`.claude/skills/`, docs/adr/0025): **create-song** (how a job's Claude makes songs from
  a prompt), **create-instrument**, and per chip **create-nes-instrument** and
  **create-scc-instrument**: what was verified and the sounds that worked.
- `docs/fur-format.md`: the .fur format as `fur/` writes it.
- The user's taste is in their **style guides** (`data/guides/`, the Guides page): chosen per prompt,
  sent with it, and kept with what it made (docs/adr/0019).
- `references/furnace/demos/`: Furnace's demo songs, for checking how Furnace itself writes things.

## Working rules

- **Pitch naming: Furnace's A-3 is 440 Hz on pulse and SCC channels**, and the NES triangle sounds an
  octave below a pulse. Write parts in true pitch and shift pulse/SCC notes down 12.
- Say what was verified (loads, renders, measured levels and pitches) and what was not (how it sounds).
- Don't claim certainty about format details that can't be verified; say what's unverified.
- Chip-specific effects (SCC wavetables, wavetable sweeps) are Claude's weakest area. Tracker-correct
  is not the same as musically idiomatic, so ask the user to sanity-check.
