# 0048. A song's actions are beside its title; Revert and Save alone at the right

- Status: accepted
- Date: 2026-10-18

## Context
The song's title row held ★ at the left and Split into channels, Revert and Save at the right. An
Export button was to be added. Put with the others at the right, the corner becomes a row of
unrelated things: two act on the unsaved edits, the others on the song as a whole.

## Decision
- The title row is grouped by what a button acts on. Beside the title, after ★: the song's own
  actions (Split into channels, Export), quiet outlined buttons. At the right: only Revert and
  Save, which act on the unsaved edits, Save lit in the accent while there are some.
- Every one of them is always in view; the row sticks under the top bar.

## Alternatives
- **All at the right, in one row.** The fewest changes, but the corner no longer means one thing.
- **A ⋯ menu for the song's actions.** Fits their role, but hides them a tap away; not wanted.
- **The song's actions in its header** (beside its facts). The header scrolls away, and the song's
  actions would be split between two places.
- **The editor's bar.** It holds the transport and the editing tools, not actions on the song.

## Consequences
The title row has two places the editor fills (`SongTitleRow.tsx`: the actions' and the save's).
A new action on the song goes beside the title.
