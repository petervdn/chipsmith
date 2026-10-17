---
name: nes-chip
description: Writing for the NES (2A03) in Furnace for chipsmith songs - its five channels, instruments and drums, idioms, levels and sounds that worked. Use when a song plays on the NES.
---

# The NES (2A03)

Chip `0x06` in Furnace, 5 channels: **pulse 1, pulse 2, triangle, noise, DPCM**, in that order
(`chips: ['nes']`, or first of several). Instruments: `makeInstrument(name, NES_INSTRUMENT, macros)`
(type 34). Macros and effects in general: **furnace-song**.

## The channels

- **Pulse 1 and 2**: `duty` macro 0-3 is 12.5%, 25%, 50%, 75% (Furnace's NES, not measured here);
  volume 0-15. Pitch resolution is coarse high up (measured): around 1 kHz one period step is about
  15 cents, so small pitch macros come out as audible steps. Lowest note Furnace "A-0" (55 Hz).
- **Triangle**: no volume control (on or off); sounds an octave below a pulse on the same note, so at
  the true pitch of its name (measured). The bass, usually; it can carry a melody too.
- **Noise**: with the default layout, register = 15 - (note & 15), so a higher note is a higher
  pitch; C-4 + k gives pitch k (measured). Drums are fixed notes (`ARP_FIXED + n`) with a volume
  shape.
- **DPCM**: samples; this project writes none, so it stays empty.

## Idioms

- Bass on the triangle, lead and harmony on the pulses, drums on the noise.
- Chords: arpeggios (`00xy` or an arp macro) on a pulse, or the two pulses on two chord tones.
- A changing duty (12.5% ↔ 25%) gives a lead movement without a second voice.

## Levels (measured, same note, volume 15)

- Triangle: about 8200, the loudest thing in every file. Pulse 50%: about 4900.
- Pads have to peak near 15 to stand next to the triangle.
- Bass + triangle kick + noise drums at chip volume 1.0 peak near full scale on their own (9500 +
  14900 + 11400).

## Sounds that worked

- **Stuttery pulse bass:** 25% pulse, volume `15 15 14 13 12 11 10 10 9`, arp macro `12 0`
  (one-tick octave blip), every 16th cut with `EC03`.
- **Kick:** a noise kick plus a triangle note with a falling arp macro.
- **Noise drums:** kick = fixed arp `8 4 2 1 0`, fast decay; snare = `13 10 9`; hat = `14`, four-tick
  decay; crash = `15 14 14`, long decay.
