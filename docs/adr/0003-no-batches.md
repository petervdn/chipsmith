# 0003. No batches: an exploration makes songs

- Status: accepted
- Date: 2026-10-16

## Context
An exploration used to write a batch: a folder of rendered files, listened to in a player. A file
the user liked was then imported into the song editor, which cut it into parts. So the same music lived
as a render in a batch and as parts in a song, under different names, in different lists.

## Decision
There are no batches. What an exploration makes is songs, at once: "ten funk grooves" makes ten songs.
The prompt they came from is a label on them (a `promptId` on their clips), a filter in the songs
list, not a container.

## Alternatives
- **Batches as now, with an import into songs.** Keeps an in-between thing that is not yet a song,
  which was most of the confusion.

## Consequences
The songs list is where a set is listened to. Most songs of an exploration are heard once: a status
(docs/adr/0009) keeps the list usable, with rejected songs hidden.
