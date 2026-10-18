# 0050. New remembers what it was left at, in this browser

- Status: accepted
- Date: 2026-10-18

## Context
The New page's choices (the prompt builder's parts and locks, the harmony and its locks, the
structure as edited) were local state: every visit started afresh, so a structure or a harmony set
up for a run of prompts had to be set up again each time.

## Decision
- They are kept in a Zustand store persisted to localStorage (`src/stores/new-song-store.ts`), and
  New opens as it was left. The hooks keep the rules of choosing; the store keeps only the values.
- What is only the view's stays local: the section selected, the presets offered to hear, the part
  a progression is being chosen for.
- Not kept: the prompt's own text and the style guides chosen, which start from the guides marked
  as defaults (0019).
- Home has Clear saved settings (at once, without asking: what it clears is minor), which puts this store and the preferences back as
  a first visit has them (`src/stores/saved-settings.ts`).

## Alternatives
- **Keep starting afresh.** A run of prompts with the same set-up repeats the setting up.
- **Kept on the server.** It would follow to another device, but it is one browser's working state,
  not data; the files on the server are what is made (0006).
- **Remember only the locked parts**, rolling the rest on each visit. Closer to "rolled to start",
  but what was set up and not locked would be lost.

## Consequences
A saved structure chosen and later deleted stays chosen as its copy until another is chosen. The
store has a version; a change to its shape bumps it, which starts New afresh once.
