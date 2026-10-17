---
name: scc-chip
description: Writing for the Konami SCC / SCC+ in Furnace for chipsmith songs - five wavetable channels, waves, wave macros (PWM, morph), idioms and levels. Use when a song plays on the SCC.
---

# The Konami SCC+

Chip `0xB4` in Furnace, 5 independent wavetable channels: `chips: ['scc']` alone (channels 0-4), or
after the NES's with `['nes', 'scc']` (channels 5-9). On the plain SCC (`0xA1`) channels 4 and 5
share a waveform; we write the SCC+. An instrument is `makeInstrument(name, 18, macros)` with a
`wave` macro holding the wavetable's index; waves are `makeWavetable(samples)`, 32 samples 0-255,
given to `buildFurFile` in `wavetables`. Macros and effects in general: **furnace-song**.

Chip-specific sound is where Claude is weakest: say what is new so the user can check it by ear.

## Idioms

- Five equal voices with any wave: chords can be held (one voice per note), not only arpeggiated;
  pads, organs and string-like leads are its strength next to the NES's pulses.
- `03xx` portamento works on SCC channels too.

## Levels (measured, same note, volume 15)

- An SCC+ wave at chip volume 1.0: about 3900, against an NES pulse's 4900; we use SCC chip volume
  1.4. In a full mix with the NES, NES 0.7 / SCC 0.85 worked.

## Waves that worked

Sine, triangle, saw, square, three pulse widths, organ, hollow, bell, reed, half-sine, notched saw,
sine+octave, bright/mid/dull (for morphing), 4-bit crushed saw and sine.

- **Width "PWM":** a looping `wave` macro stepping through pulse12 / 25 / 37 / square.
- **Morph:** a non-looping `wave` macro bright → mid → dull, so a held note darkens.
