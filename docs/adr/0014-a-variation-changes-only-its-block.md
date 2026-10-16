# 0014. A new version of a clip changes only the block it was asked for

- Status: accepted
- Date: 2026-10-16

## Context
When a clip is changed by a prompt in a song, a new clip is made (0005). The question was which blocks
then play it: the one it was asked for, every block of the song that played the old clip, or every
song's.

## Decision
Only the block the change was asked for. If the old clip is used by more blocks of the same song,
the page offers to change those too ("also used in 2 more blocks in this song: update those too?").
Other songs are never changed or offered.

## Alternatives
- **Every block of the song.** A repeated section changes everywhere at once, but a change lands
  where it was not asked for.
- **Every song.** A change in one song would change others unseen.

## Consequences
The block's details list the versions of its slice, so an earlier one can be put back.
