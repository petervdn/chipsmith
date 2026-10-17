# 0035. The MSX PSG is a chip a song can use; the New page stops offering the SID

- Status: accepted
- Date: 2026-10-17

## Context
Konami's MSX music pairs the SCC with the PSG (the AY-3-8910 every MSX has), which plays the drums
the SCC cannot (it has no noise). Gyruss, Stage 2 (References) does this to great effect. The app
wrote only the NES, the SCC and the SID. Meanwhile, measuring the songs made with the SID showed
11% of its notes starting about 33 ms late, a cause not found.

## Decision
- The PSG is a chip: `psg` in a song's chips, Furnace chip `0x80`, channels PSG 1-3, coming after
  the NES's and before the SCC's (as an MSX has them); written with the settings every MSX demo in
  Furnace has (`chipType=1`, `clockSel=0`, `stereoSep=0`); instruments of type 6, with the macros
  `ex2`, `ex3`, `alg` and `phaseReset` the instrument writer did not have. A psg-chip skill holds
  what is known, its drums from Gyruss.
- The New page offers NES, PSG and SCC; the SID is left out for now. The app still writes, reads and
  plays it, and a prompt that names it still gets it.

## Alternatives
- **Drums on the NES beside the SCC.** Works, but is not the MSX sound and takes a chip of five
  channels for one drum channel.
- **Drums on the SCC itself** (wave tricks). No noise: thin snares and hats.
- **Keep offering the SID.** Its late notes are heard (the user found them before they were
  measured); new songs on it would have them until the cause is found.

## Consequences
The PSG's macro meanings are taken from Furnace's demos; the wave bits and the pitch (A-3 at
220 Hz, true pitch) are checked by render, the noise frequency's direction and the envelope's
shapes not yet. The SID comes back to New when its timing is fixed.
