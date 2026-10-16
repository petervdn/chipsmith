# 0006. The files are the data; the server holds a copy in memory, no database

- Status: accepted
- Date: 2026-10-16

## Context
The old editor kept its songs in SQLite with files beside it, and the database was the truth. A clip
that holds its own information (0004) is a folder of files anyway, and the numbers are small: even
ten thousand clips are a few megabytes of JSON.

## Decision
`clips/<id>/clip.json` and `songs/<id>/song.json` are the data. The server reads them all when it
starts and keeps them in memory; a change is written to its file first (through a file beside it,
renamed over it, so a crash never leaves half a file), then to the copy in memory. Only the server
writes song.json; a Claude job only creates new clip folders.

## Alternatives
- **SQLite as the truth**, as before. Not diffable in git, not readable without the app, and a second
  place a clip's information would live.
- **SQLite as an index of the files.** Not needed at this size; it can be added later as a cache
  without changing the files.

## Consequences
Songs and clips diff in git. Undo history and job logs are kept in memory and lost on a restart;
what was saved is in git.
