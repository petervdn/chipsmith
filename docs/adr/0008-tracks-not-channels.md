# 0008. A row of the arrangement is a track; a channel is the chip's

- Status: accepted
- Date: 2026-10-16

## Context
Calling the arrangement's rows "channels" was considered.

## Decision
A row of a song's arrangement is a track. "Channel" means only a chip channel (pulse 1, triangle,
noise, SCC 1-5), as Furnace means it and as a clip's `channels` do.

## Alternatives
- **Channels.** A track can hold a clip of several chip channels (chords on 1, 5, 6 and 7), a whole
  piece, or clips from different songs whose channel numbers mean different things; "channel 2" would
  then mean two things in every prompt.

## Consequences
None beyond the names.
