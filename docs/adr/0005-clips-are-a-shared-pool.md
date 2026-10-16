# 0005. Clips are one shared pool; a song points to clips, and a clip never changes

- Status: accepted
- Date: 2026-10-16

## Context
A clip is made in a song but may be wanted in another. Kept inside its song, it would have to be
copied to be used elsewhere: two ids for one sound.

## Decision
All clips live in `clips/<id>/`. A song is only its arrangement: its blocks name clips by id. A
clip's audio and source never change once made; a change is a new clip (docs/adr/0014). The song a
clip was made in is noted (`madeFor`), for information. Which songs use a clip, and which clips were
made from it, are worked out from the songs and clips, never stored.

## Alternatives
- **Clips inside their song's folder.** A song folder would be whole on its own, and deleting a song
  would delete its clips; but reuse means copies.

## Consequences
Deleting a song leaves its clips. Clips no song uses are shown as unused; removing them is a step of
its own.
