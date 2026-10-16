# 0015. A clip is rendered with the Furnace app's command line, one at a time with a pause

- Status: accepted
- Date: 2026-10-17

## Context
A clip's audio is its source.fur rendered by Furnace. The installed app's binary renders with
`-output`, but it starts the whole app each time and opens a CoreMIDI client, which macOS refuses
after many quick launches. A Furnace build without its GUI, SDL and MIDI was tried (docs/later.md):
it builds, and renders equal the app's except the NES noise channel's samples, which has not been
listened to.

## Decision
Render with the app's binary (`render/furnace.ts`): one render at a time, a pause of a second
between one exit and the next start, three tries. Furnace's version is written in clip.json.

## Alternatives
- **The headless build.** No app start and no pause, renders could run side by side; set aside until
  its noise channel is listened to (docs/later.md).

## Consequences
A render takes about 1.4 s for a 50 s song, 1 s of it the pause; a song cut into 16 clips about 20 s.
