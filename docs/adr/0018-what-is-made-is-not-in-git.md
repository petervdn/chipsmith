# 0018. What is made is never in git; five examples are, and missing audio is rendered on start

- Status: accepted
- Date: 2026-10-17

## Context
The repository is public and is meant to be the tool, cloned by others. Until now it also held
the user's songs: every clip and song, most brought in from the project before its restart, and in
its first commit that whole earlier project, batches of .fur files included. Someone cloning got the
user's library and no audio for it, as nothing rendered a missing audio.flac, although 0011 said the server would.

## Decision
- What is in the data folder (`CHIPSMITH_DATA`, default `data/` in the project folder) is ignored
  by git; the folder itself is in it with a README, so a checkout shows where what is made lives.
  Nothing made with the app is committed.
- `examples/` holds five songs and their clips (clip.json, source.fur, script.ts, no audio), picked
  for spread: a 3/4 action fugue on NES + SCC+, a fast NES fugue, two ambient chord pieces (NES; NES +
  SCC+, 8/4) and an NES funk groove. When the data folder has no clips and no songs, the server
  copies them into it.
- When the server starts it renders every clip with a source.fur and no audio.flac, one at a time
  in the background. The FLAC is written under another name and renamed when whole.
- Claude Code and a job's script run in the project folder; the data folder is named to them.
- The user's songs and the earlier project were taken out of the repository's history: the first
  commit (the earlier project) and every `clips/` and `songs/` were removed, the branch `archive`
  deleted, and the history pushed again. So were the user's notes (taste, feedback per style, chat
  logs) and their name: those are in the data folder's `guidance/`, which the composing Claude is
  told to read. The round trip of the .fur writer is tested on the examples' .fur files
  instead of the old project's 1,534.

## Alternatives
- **Render on first play.** No wait at start, but the first ▶ of each song waits for a whole render.
- **The examples read in place, not copied.** Would keep them apart, but they could then not be
  rated, rejected or changed like any other song.
- **The user's songs in a private repository of their own.** Still possible for the data folder; it does
  not belong in the tool's.

## Consequences
A fresh checkout plays its examples once their renders are done (a few seconds each). The user's
data is in `data/` and needs a backup of its own. Old clones and forks still have the old history.
