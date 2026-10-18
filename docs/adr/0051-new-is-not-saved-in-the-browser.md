# 0051. New keeps its choices while the page is open, not in the browser's storage

- Status: superseded by 0052
- Date: 2026-10-18

## Context
0050 kept the New page's choices (the prompt builder's parts and locks, the harmony and its locks,
the structure as edited) in localStorage, so New opened as it was left, even days later. What was
set up for one run of prompts came back for the next, which then had to be undone, and Home needed
a button to clear it.

## Decision
- The store stays (`src/stores/new-song-store.ts`) but is not persisted: going to another page and
  back finds New as it was; a reload, or a new visit, starts afresh (parts rolled, nothing locked,
  the harmony Claude's choice, no structure).
- Home's Clear saved settings clears only the preferences, and its line no longer names New.

## Alternatives
- **Keep persisting (0050).** Old set-ups come back unasked.
- **Local state again, afresh on every visit to New.** Leaving New for a moment (to read a guide,
  to hear a song) would lose what was set up.

## Consequences
A browser that used 0050 still holds `chiptune.new-song` in its localStorage; nothing reads it.
