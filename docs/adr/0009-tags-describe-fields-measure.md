# 0009. Tags describe, fields measure; a status per song and clip

- Status: accepted
- Date: 2026-10-16

## Context
Explorations make many songs and clips; they must be found again.

## Decision
- What can be measured is a field: tempo, meter, key, chips, length, channels, created. Lists filter
  on these as values and ranges.
- What describes is a tag, one flat vocabulary for songs and clips: style (`funk`, `fugue`), role
  (`bass`, `lead`), character or technique (`walking-bass`, `harsh`), and the user's own (`good-bass`,
  `for-title-screen`), which also serve as playlists. A tag says who gave it: Claude, when it made the
  clip, from a fixed list in the notes; or the user. Variations and splits take their parent's tags.
- A status: new, heard, keeper (shown as ★), rejected (hidden unless asked). Rejected was taken
  out: a song not wanted is deleted (0028).

## Alternatives
- **Facts as tags** (`120bpm`, `7-8`). They cannot be filtered as ranges and drift in spelling.
- **Votes apart from a status** (thumbs up and down, a star), as before: three things for one.

## Consequences
Tags live in clip.json and song.json; the lists count and offer them.
