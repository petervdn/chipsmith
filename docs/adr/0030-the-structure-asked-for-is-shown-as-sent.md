# 0030. The structure a song was asked for is shown as it was sent

- Status: accepted
- Date: 2026-10-17

## Context
A song keeps the structure sent with its prompt (0023), but the editor showed nothing of it, so
there was no way to see whether the music follows it. The plan in docs/architecture.md ("Still to
build") was to label the sections Claude wrote, returned by the script and kept on the whole clip,
moved with its block; it argued against drawing the structure sent, since Claude may not follow its
bars, songs without one get nothing, and labels pinned to the ruler stay put when blocks move.

## Decision
The editor can draw the structure as it was sent, in a thin row of tiles above the first track:
each section where its bars fall from the song's first bar, at the song's beats to a bar. A switch
in the editor bar (view: structure, kept in the preferences, on to start with) shows or hides it;
it is offered only for a song that was sent a structure. It is a picture of what was asked and
nothing more: it does not follow edits, is not saved with the arrangement, and nothing reads it.

## Alternatives
- **The sections as written, kept on the clip and moved with its block.** Truer to the music, but
  needs the script, the check and the clip's record to change. Left for later, if wanted.
- **Show nothing.** The structure stays invisible, though the song was made to follow it.

## Consequences
Where Claude did not follow the bars, the tiles and the music disagree, and that is visible: it is
what the row is for. Once blocks are moved, the row still shows the song as asked, from bar 1.
Songs made without a structure have no row and no switch.
