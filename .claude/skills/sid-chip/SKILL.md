---
name: sid-chip
description: Writing for the Commodore 64 SID (6581) in Furnace for chipsmith songs - three channels, SID instruments (waveforms, ADSR, pulse width, filter, ring, sync), macros, idioms, drums and levels. Use when a song plays on the SID.
---

# The SID (Commodore 64)

Chip `0x47` in Furnace (the 6581, the first C64's), 3 channels (SID 1-3): `chips: ['sid']` alone, or
after the NES, PSG and SCC with others (NES first, then PSG, SCC, SID). Its clock is PAL.

**Timing (measured 2026-10-17):** in the four songs made with it, 11% of SID notes that start from
silence start about 33 ms late (two ticks), on bass, lead and drums alike; no NES or SCC note in
the same songs did. The cause is not found: Furnace's envelope reset time (`initResetTime` 0-4)
did not change it, nor did whole ticks to a row. Until it is, the New page does not offer the SID
(docs/adr/0035); a prompt that names it still gets it. Song-wide
things: **furnace-song**. Sources: Furnace 0.6.8.3's C64 pages (doc/7-systems/c64.md,
doc/4-instrument/c64.md, papers/newIns.md) and the C64 demos in `references/furnace/demos/c64/`
(read with `node fur/dump.ts <file> --ins`). Marked **measured** where rendered and checked here;
none of it has been heard by the user yet.

## Pitch (measured)

**A SID note sounds at the true pitch of its name: Furnace A-3 is 220 Hz.** Do not shift SID notes
down 12 as pulse and SCC notes are.

## An instrument

```ts
import { makeInstrument } from '<to project>/fur/instrument.ts';
import { makeSidFeature, SID_INSTRUMENT } from '<to project>/fur/sid.ts';

const bass = makeInstrument('bass', SID_INSTRUMENT, macros, [
  makeSidFeature({ waves: ['pulse'], attack: 0, decay: 9, sustain: 0, release: 0, … }),
]);
```

`makeSidFeature` (`fur/sid.ts`) needs the waves and the envelope; the rest defaults to a square
pulse, no filter, no ring or sync:
- **`waves`**: `tri`, `saw`, `pulse`, `noise`; several are mixed (AND: thinner, metallic), noise
  only alone.
- **`attack`, `decay`, `sustain`, `release`**: 0-15 each. A held note needs `sustain` above 0;
  plucks and drums use `sustain: 0` and a decay of 4-12.
- **`duty`**: pulse width 0-4095, 2048 square. Keep `isDutyReset` on (the default): **without it a
  pulse instrument is silent** (measured).
- **Filter**: `isFiltered` (through the filter), `isFilterSet` (a note sets it), `cutoff` 0-2047,
  `resonance` 0-15, `filterModes` `low` / `band` / `high` (several: notch etc.). The filter is one
  for the whole chip: the last instrument to set it wins.
- **`isRing`**, **`isSync`**: ring modulation and hard sync by the channel before (SID 1 for SID 2).
- **`isDutyAbsolute`**, **`isCutoffAbsolute`**: the duty / cutoff macro sets the value instead of
  moving it; the demos use absolute macros.

## Macros

`vol` is the chip's volume, for all three channels; leave it out. `arp`, `pitch`, `duty` (width),
`wave` (bits: tri 1, saw 2, pulse 4, noise 8, so 5 is pulse+tri), and the SID's own:
`cutoff` (0-2047 when absolute), `filterMode` (bits: low 1, band 2, high 4), `resonance` (0-15),
`special` (bits: gate 1, then sync 2, ring 4, test 8 as the chip's register has them; the demos use
gate and test).

## Effects (Furnace's C64 page)

`20xy` attack/decay, `21xy` sustain/release, `13xx` resonance, `14xx` filter mode (1 low, 2 band,
4 high), `4xxx` cutoff (000-7FF), `3xxx` pulse width (000-FFF), `22xx`/`23xx` width slide up/down,
`24xx`/`25xx` cutoff slide up/down, `10xx` waveform. The demos mostly use the shared ones instead:
`04xy` vibrato, `03xx` portamento, `01xx`/`02xx` slides. The sound is in the instruments.

## Idioms (from the demos)

- **Filtered pluck bass**: pulse, `decay` 8-9, `sustain: 0`, filter low with resonance 15 and an
  absolute cutoff macro falling from high to low (`2047 1458 1320 1136 962 819 604 379 266 113 41`).
- **Pulse-width sweep** for a moving lead or pad: an absolute `duty` macro running up and down
  (`819 691 563 589 973 1408 1689 1459 1229 1024 768 589 410 640 896`, looping), or `22xx`/`23xx`.
- **Arpeggio chords**: an `arp` macro on one channel (`0 4 7`, or fixed notes) stands for a chord.
- **Drums** switch waveform per tick with a `wave` macro and fixed notes in `arp`:
  snare `wave 8 4 4 8` (noise, pulse, noise) with `arp @120 @47 @47 @60 @80`; kick a pulse or noise
  with a falling arp (`0 -5 -8 -10 -12 -16 -21 -27 -35 -39 -45`) and `decay` 6-9; hats noise with a
  high fixed note (`@120`), short decay, sometimes through a high-pass filter.
- **Chords on saw+pulse** with a low-pass filter (cutoff around 100-150, resonance 4) for a soft pad.

## Levels (measured, chip volume 1.0, sustain 15)

A SID pulse peaks at about 7400, a saw about 6800 (an NES pulse: about 4900). Three channels
together can clip: check the mix's peak.
