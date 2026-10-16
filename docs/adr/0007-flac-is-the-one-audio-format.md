# 0007. FLAC is the one audio format

- Status: accepted
- Date: 2026-10-16

## Context
Batches were MP3, for listening on a phone; editor parts were WAV, because a part must sit on the bar
grid to the sample and MP3 adds silence at the start and pads the end. The editor's WAVs were 1.1 GB,
and slow to load on a phone. Two parts measured: 920 kB of WAV were 30 kB of FLAC, and 1.18 MB were
505 kB (MP3 at 192k: 252 and 322 kB).

## Decision
Every clip's audio is `audio.flac`: lossless and exact to the sample like WAV, often smaller than MP3.

## Alternatives
- **WAV.** Exact, but large.
- **MP3 or Opus.** Small, but not exact to the sample (encoder delay and padding), so a clip would
  not line up with the grid or loop without a gap.

## Consequences
Chrome, Firefox and Safari decode FLAC in Web Audio. One format to render, serve and play.
