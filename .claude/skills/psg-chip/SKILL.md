---
name: psg-chip
description: Writing for the MSX PSG (AY-3-8910) in Furnace for chipsmith songs - three square channels with a shared noise and hardware envelope, drums on one channel, levels, and how Konami pairs it with the SCC. Use when a song plays on the PSG.
---

# The PSG (AY-3-8910)

The sound chip every MSX has built in; the SCC came on the cartridge beside it, and Konami's MSX
music is the two together: the SCC for bass, chords and leads, the PSG for drums and effects.
Chip `0x80` in Furnace, 3 channels, **PSG 1-3**: `chips: ['psg']`, or with the SCC
`['psg', 'scc']` (PSG 1-3 are channels 0-2, SCC 1-5 are 3-7). Written with the MSX settings
Furnace's MSX demos all have (`chipType=1`, `clockSel=0`). Instruments:
`makeInstrument(name, PSG_INSTRUMENT, macros)` (type 6). Macros and effects in general:
**furnace-song**.

## The channels

- Each channel is a **square wave** with 16 volume steps; all three share **one noise generator**
  and **one hardware envelope**, so two channels using noise share its pitch.
- **Pitch** (measured): A-3 sounds at 220 Hz, at its name, as the SID does: write it in true pitch,
  no shift (the SCC's A-3 is 440 Hz).
- The `wave` macro mixes what a channel plays, as bits: **1 tone, 2 noise, 4 envelope** (`1` a plain
  square, `2` noise only, `3` tone and noise, `5` tone shaped by the hardware envelope).
- `duty` is the **noise frequency**, 0-31.
- `ex2` is the hardware envelope's shape, `ex3` / `alg` the auto-envelope's ratio to the note
  (numerator / denominator): the envelope repeating at a multiple of the note's frequency is the
  PSG's buzzy bass and kick sound.
- These macro meanings are Furnace's as its MSX demos use them; the `wave` bits and the pitch are
  checked here by render, `duty`'s direction and the envelope's shapes are not yet: say what you
  used so the user can check it by ear.

## Drums (from Konami's Gyruss, Stage 2: `references/furnace/demos/msx/Gyruss_Stage_2.fur`)

The whole kit on **one PSG channel**, one note per hit, the instrument choosing the drum; the
other two channels stay free.
- **Kick**: `wave` 5 (tone with the envelope), a fixed `arp` note (`ARP_FIXED + 36`) and a steep
  downward pitch slide, the auto-envelope at 1/8 (`ex2` 2, `ex3` 1, `alg` 8). Without the envelope:
  `wave` 1 and a fixed `arp` falling over a few ticks with the volume (`ARP_FIXED + 60, 48, 40, 34`),
  which renders as a kick here.
- **Snare**: tone with the envelope for a tick, then noise (`wave` 5, 2), the noise frequency moving
  (`duty` 0, 25, 26, 25, 24, then 23), the volume falling over about 20 ticks (15 down to 0).
- **Hat**: noise only (`wave` 2), `duty` 31, volume 10, 6, 5, 0: four ticks.

## Idioms

- Three voices only: with the SCC beside it, give the PSG the drums and an effect or a second lead,
  and the SCC the rest.
- A square lead on the PSG is harder and plainer than an SCC wave: good for an answer or a
  doubling an octave apart.
- Short notes (a release, `REL`, or a cut the row after) keep a groove tight; Gyruss releases its
  bass on every other row.

## Levels (measured, same note, volume 15, chip volume 1)

A PSG square peaks at about 0.20 of full scale, an SCC+ sine at 0.17: about equal; Gyruss has both
chips at volume 1.
