# 0028. A song not wanted is deleted, not rejected

- Status: accepted; a take's trash can added by 0039
- Date: 2026-10-17

## Context
A song or a clip could be rejected (✕): a status that hid it from the lists until "rejected" was
ticked in the filter bar (0009). Rejected songs were never looked at again, but stayed on disk, were
read on every start and needed a switch, an undo bar and a case in every count.

## Decision
- The status is new, heard or keeper; there is no rejected.
- A song not wanted is deleted: the trash can on its row in the songs list, asked first in the page's
  dialog (0026). Its folder goes, and with it every clip it played that no other song plays and no
  kept clip was made from, then the clips those were made from, on the same rule
  (`deleteSong` in `server/store.ts`, `DELETE /api/songs/<id>`).
- Clips have no trash can of their own: a clip goes when the last song that plays it does.

## Alternatives
- **Keep rejecting, hidden.** What the user asked to be rid of: a rejected song is never wanted back.
- **Delete the song and keep its clips.** The pool would fill with clips no song plays and nothing
  shows.
- **A trash can on clips too.** A clip a song plays cannot go without breaking the song; one no song
  plays is already deleted with its song.

## Consequences
A deletion cannot be undone. A job's card still names a song it made after the song is deleted, and
its link leads to a song that is not there. A song.json or clip.json with `"rejected"` no longer
reads (it is reported as unreadable).
