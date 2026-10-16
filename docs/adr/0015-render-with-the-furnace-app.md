# 0015. A clip is rendered with the Furnace app's command line, one at a time

- Status: accepted
- Date: 2026-10-17

## Context
A clip's audio is its source.fur rendered by Furnace. The installed app's binary renders with
`-output`, but it starts the whole app each time and opens a CoreMIDI client, which macOS refuses
after many quick launches. A Furnace build without its GUI, SDL and MIDI was tried (docs/later.md):
it builds, and renders equal the app's except the NES noise channel's samples, which has not been
listened to.

## Decision
Render with the app's binary (`render/furnace.ts`): one render at a time, three tries, a failed one
tried again after a pause of 1 s, then 2 s. (A pause of a second before every render was dropped on
2026-10-17: 75 renders back to back without one all worked.) Furnace's version is written in clip.json.

## Alternatives
- **The headless build.** No app start and no pause, renders could run side by side; set aside until
  its noise channel is listened to (docs/later.md).

## Consequences
A render takes about 0.5 s for a 50 s song; a song cut into 16 clips a few seconds.
