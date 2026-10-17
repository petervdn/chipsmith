---
name: scc-chip
description: Writing for the Konami SCC / SCC+ in Furnace for chipsmith songs - five wavetable channels, waves, wave macros (PWM, morph), idioms and levels. Use when a song plays on the SCC.
---

# The Konami SCC+

Chip `0xB4` in Furnace, 5 independent wavetable channels: `chips: ['scc']` alone (channels 0-4), or
after the NES's with `['nes', 'scc']` (channels 5-9). Two SCCs, `['scc', 'scc']`, give 10 channels
(SCC 1-10, the second's after the first's), as two SCC cartridges in an MSX's two slots; each
channel has its own wave either way, so the second SCC is for more voices, not another sound. On the plain SCC (`0xA1`) channels 4 and 5
share a waveform; we write the SCC+. An instrument is `makeInstrument(name, 18, macros)` with a
`wave` macro holding the wavetable's index; waves are `makeWavetable(samples)`, 32 samples 0-255,
given to `buildFurFile` in `wavetables`. Macros and effects in general: **furnace-song**.

On an MSX the SCC sits beside the PSG (**psg-chip**), which Konami gave the drums: `['psg', 'scc']`
puts the PSG's 3 channels first.

Chip-specific sound is where Claude is weakest: say what is new so the user can check it by ear.

## Idioms

- Five equal voices with any wave: chords can be held (one voice per note), not only arpeggiated;
  pads, organs and string-like leads are its strength next to the NES's pulses.
- `03xx` portamento works on SCC channels too.

## Levels (measured, same note, volume 15)

- **Volume steps are even in amplitude** (measured on a square): 13 is -1.2 dB, 11 -2.7, 9 -4.5,
  7 -6.7, 5 -9.6, 3 -14.1 against 15. A bright wave (a pulse) sounds far louder than a saw or sine
  at the same volume: a slanted pulse at 15 measured 8 dB over a notched saw at 13, and the user
  heard it as too loud. Set a new line's volume against the line it answers.
- An SCC+ wave at chip volume 1.0: about 3900, against an NES pulse's 4900; we use SCC chip volume
  1.4. In a full mix with the NES, NES 0.7 / SCC 0.85 worked.

## Waves that worked

Sine, triangle, saw, square, three pulse widths, organ, hollow, bell, reed, half-sine, notched saw,
sine+octave, bright/mid/dull (for morphing), 4-bit crushed saw and sine.

- **Width "PWM":** a looping `wave` macro stepping through pulse12 / 25 / 37 / square, slowly.
- **A `wave` macro must not switch faster than about 4 times a second** (a step of 15 ticks or
  more at 60 Hz). Faster, each switch is heard as a pulse in the note: a loop of three slanted
  pulses at speed 4 (15 switches a second) was heard by the user as an annoying 10-20 Hz flutter
  in a lead, and they do not want to hear it again. For a lead, one wave; for movement, a slow
  sweep or a morph that does not loop.
- **Morph:** a non-looping `wave` macro bright → mid → dull, so a held note darkens.
