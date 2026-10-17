---
name: create-instrument
description: Build a Furnace instrument for a chipsmith song (makeInstrument, macros, wavetables). Use when a song's script needs an instrument or drum sound; then the chip's own skill (create-nes-instrument, create-scc-instrument).
---

# Create an instrument

An instrument is made in a song's script (the **create-song** skill) with
`makeInstrument(name, type, macros)` (`fur/instrument.ts`) and given to `buildFurFile` in
`instruments`; a row plays it by its index. What a chip's channels can do, its instrument type, its
levels and the sounds that worked on it: **create-nes-instrument**, **create-scc-instrument**.

## Macros

- `vol`, `arp`, `duty`, `wave`, `pitch`, each `{ kind, values, loop?, release?, speed? }`; 255 (or
  left out) is no loop or release.
- **Macros run at 60 Hz regardless of the song's virtual tempo.** A macro's length in seconds =
  steps × speed / 60.
- `arp` values are semitone offsets; `ARP_FIXED + n` makes a fixed note n instead (drums).
- `pitch` units: ±32 measured as about ±20-25 cents on a pulse near 1 kHz (measured).
- A wavetable (for a chip with waves): `makeWavetable(samples)`, 32 samples 0-255, given to
  `buildFurFile` in `wavetables`; the `wave` macro picks one by index.

## Macro recipes that worked

- **Pad swell:** volume `2 3 5 7 8 10 12 13 15 15 14 13 12 11 10 9 8 7 6` at speed 12-14 (about
  3.8 s), then holds. Pads have to peak near 15 to stand next to the NES triangle.
- **Tape wow:** looping pitch macro `0 8 16 24 32 24 16 8 0 -8 … -8` at speed 4-5; give the second
  voice the inverted macro.
- **Quick attack** (a passing chord): volume `5 7 8 8 7 7 6 6` at speed 3.
