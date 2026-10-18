# 0039. A take not wanted is deleted; the take in a block can be updated

- Status: accepted
- Date: 2026-10-18

## Context
Every change to a clip makes a take (0037), and a clip never changes (0005). Takes pile up: a take
with a mistake, fixed by making another, leaves two, and the one with the mistake is never wanted
again. 0028 gave clips no trash can, as a clip went with its song; a take no block plays went
nowhere ("the clean-up still to build").

## Decision
- **The take a block plays has a trash can** beside its name in the takes, asked first in the
  page's dialog (0026). The original of a line has none: it is the safety net.
- **Deleting it** (`DELETE /api/clips/<id>`, `server/take-deletion.ts`) removes its folder for
  real, as a song's is (0028). The saved song's blocks that played it play the clip it was made
  from, and so do the draft's, in every undo step; the takes made from it are made from that clip
  instead, so the line of takes stays one line.
- **It is done at once on the server**, not on Save: a draft that only went back would point at a
  clip that is gone. A draft with edits of its own keeps them; one without starts again from the
  saved song (`use-song-draft.ts`).
- **A take another song plays is not deleted**; the answer names the song.
- **The note grid saves a new take, or updates the take in the block**: Save as new take, as
  before ("Try" read as a preview, and it never was one), and, when the block plays a take, Update
  this take: a new clip with the edits, the old take's label and parent, put in its place as a
  deletion puts the parent (blocks and takes made from it), and the old take deleted. The octave and
  semitone buttons and a prompt only make new takes; one that came out wrong is deleted.

## Alternatives
- **Overwrite a take's files in place.** A clip's audio is served and cached by its id, and what was
  heard would no longer match its source; a clip never changes (0005).
- **Hide a take instead of deleting it** (`removed`, as a job). What is not wanted is deleted
  (0028); a hidden take would still be read, counted and kept in step.
- **A temporary preview before a take is made.** More to build and to show on a phone than a take
  that can be deleted.

## Consequences
A take deleted cannot be brought back. A job's card that made it still names it. A clip's record
changes its `parent` when the take it was made from is deleted: the record says what the clip goes
back to now, not the take that was in between.
