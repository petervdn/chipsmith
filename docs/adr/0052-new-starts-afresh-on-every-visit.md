# 0052. New starts afresh on every visit

- Status: accepted
- Date: 2026-10-18

## Context
0051 stopped saving the New page's choices in the browser but kept them while the app stayed open,
so leaving New and coming back still found the last set-up. That was not what was asked: New's
choices are not to carry over at all.

## Decision
- Every visit to New starts as the first: parts rolled, nothing locked, the harmony Claude's
  choice, no structure. The store (`src/stores/new-song-store.ts`) stays, shared by New's hooks
  while the page is open, and is started afresh when the page is left (`use-fresh-choices.ts`).

## Alternatives
- **Keep them while the app is open (0051).** Leaving New for a moment kept the set-up, but it
  came back when it was not wanted.
- **Local state in each hook again, no store.** The same behaviour, but the structure's saving reads
  the latest draft after an await, which the store gives without refs; a larger change for nothing
  seen.

## Consequences
Leaving New to read a guide or hear a song loses what was set up there.
