# 0022. An edit is a draft in the page until it is saved

- Status: accepted, for now
- Date: 2026-10-17

## Context
The editor changes a song's arrangement. Other things read the song as it is saved: ▶ in the
lists, its facts, "Prompt again" and "Use as base". The old project's editor kept a draft and threw
it away when the tab was hidden, which loses work on a phone.

## Decision
For now an edit is a draft in the page, with undo and redo: the song shows "unsaved changes", Save
writes its tracks (`PUT /api/songs/<id>/tracks`), Revert goes back to the saved song, and leaving
the page loses the draft. Mute and solo are only the editor's, never saved. How a draft survives
leaving the page is to be solved later.

## Alternatives
- **Every edit saved at once, with undo.** Nothing lost, but the saved song is any state in the
  middle of an edit, and there is no "the original" to go back to.
- **A draft kept on the server** (`draft.json` beside the song). Nothing lost and a deliberate saved
  state, but more to build; set aside, not rejected.

## Consequences
A song is changed only by Save. The tracks are checked where they come in, and a block whose clip
is not in the pool is refused.
