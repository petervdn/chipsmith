# 0029. Clips are not in the top bar

- Status: accepted
- Date: 2026-10-17

## Context
The top bar had Songs | Clips | Guides | Jobs. The clip pool is shared (0005), but no song shares a
clip: the Clips page is a long flat list of clips each played by one song, and a song's clips are
already in its editor's clip column.

## Decision
Clips is no longer a tab of the top bar, and the top bar no longer counts the clips. The Clips page
stays at `/clips`, opened by its address; `clips/` on disk and the shared pool are unchanged.

## Alternatives
- **Keep the tab.** It led to a list that is not used: a clip is worked on in its song.
- **Group the Clips page by song, or drop it.** Still open (docs/architecture.md, "Still to build"):
  the tab goes first, the page's future is decided with the rest of what clips are for.

## Consequences
Every page reads one list fewer when it opens. The only way to the Clips page is its address.
