# 0058. A take starts from its clip and writes only what it changes

- Status: accepted
- Date: 2026-10-23

## Context
A job of takes copied the clip's script and wrote it out again whole: 11 to 15k characters, every
channel of the song, about 10k of its 10 to 14k output tokens, even when the take keeps one
channel and the others are cut away after (j0043, j0047, j0051). It also spent turns reading the
clip's record, its song and its script.

## Decision
- The server works out what the job is told of the clip (`server/take-context.ts`): its facts and
  label, its song and tracks, the channels a take keeps by number and name, the size of its runs
  of rows, and the script that wrote it, or the clip as tracker text when it has none. The prompt
  says they are given.
- A take's script reads the clip's `source.fur`, takes the run of each channel it changes
  (`getChannelRun`), writes it anew or changes it with the kit (`make/score.ts`), and puts it back
  (`setChannelRun`); the rest of the file stays the clip's. The furnace-song skill teaches it.
- A take of another length is built with `buildFurFile` from the clip's runs.

## Alternatives
- **Copy the clip's script and change it (as before).** The music stays in the composer's own
  notation, but every take writes the whole song again.
- **Give only the channel's notes (the note grid's rows).** Smaller still, but the script that
  wrote it says more of the music (the form, the harmony, the other parts).

## Consequences
A take's script is mostly the channel it changes. Its own `script.ts` no longer makes the whole
song: a take of a take starts from the take's `source.fur`, as it already did for takes made
without Claude.
