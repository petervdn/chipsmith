---
name: create-nes-instrument
description: NES (2A03) instruments and drums in Furnace for chipsmith songs: its channels, levels, pitch quirks and sounds that worked. Use when a song plays on the NES.
---

# Create an NES instrument

The NES 2A03 in Furnace: chip `0x06`, 5 channels (pulse 1, pulse 2, triangle, noise, DPCM).
Instruments are `makeInstrument(name, NES_INSTRUMENT, macros)` (type 34). Macros in general: the
**create-instrument** skill.

## The channels

- **Pulse**: `duty` macro 0-3 is 12.5%, 25%, 50%, 75% (Furnace's NES, not measured here). Volume
  0-15. Pitch resolution is coarse high up (measured): around 1 kHz one period step is about 15
  cents, so small pitch macros come out as audible steps.
- **Triangle**: no volume control; it sounds an octave below a pulse on the same note, so at the true
  pitch of its name (measured).
- **Noise**: with the default layout, register = 15 - (note & 15), so a higher note is a higher
  pitch; C-4 + k gives pitch k (measured). Drums are fixed notes (`ARP_FIXED + n`) with a volume
  shape.

## Levels (measured, same note, volume 15)

- Triangle: about 8200. It is the loudest thing in every file.
- Pulse 50%: about 4900.

## Sounds that worked

- **Stuttery pulse bass:** 25% pulse, volume `15 15 14 13 12 11 10 10 9`, arp macro `12 0`
  (one-tick octave blip), every 16th cut with `EC03`.
- **Kick:** a noise kick plus a triangle note with a falling arp macro.
- **Noise drums:** kick = fixed arp `8 4 2 1 0`, fast decay; snare = `13 10 9`; hat = `14`, four-tick
  decay; crash = `15 14 14`, long decay.
