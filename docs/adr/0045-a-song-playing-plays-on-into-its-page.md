# 0045. A song playing when its page opens plays on in the editor

- Status: accepted
- Date: 2026-10-18

## Context
0043 had a song's page stop whatever played when it opened, so the editor always started stopped at
the start. Opening the song that was playing (▶ on its row, then its title) cut it off, and it had to
be found again from the start. The editor's transport, playhead and following already read the one
player by the song's id, so they show the song playing wherever it was started.

## Decision
Opening a song's page stops only what is not that song: another song, or a reference. The song
itself, playing or loading, plays on: the editor shows it playing, its playhead where it is, and its
transport pauses and stops it as if it had been started there. Its cursor is at the start, so ■
goes back there.

## Alternatives
- **Stop it, as 0043 did.** The editor starts in a known state, but the listening is broken off at
  the moment the user goes to work on the song.
- **Stop it and start it again from the same second in the editor.** The same in the end, with a gap
  and a reload of its audio for nothing.

## Consequences
A song played from a list plays as the list's player started it: without the editor's loop until
looping is switched on, which plays it on round the loop from where it is. Mute and solo apply to it
as soon as they are set, as to any play.
