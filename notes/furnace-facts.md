# Furnace facts

Verified facts about Furnace and the chips the app writes for (NES 2A03, Konami SCC+), and sound recipes
that worked. Everything marked **measured** was checked by rendering with the Furnace command line and
analysing the WAV; nothing here is a judgement about how something sounds.

## Verified Furnace facts

### File format (writer: `fur/write.ts`, reader: `fur/read.ts`)

- We write format version 223 (Furnace 0.6.8) with the old `INFO` header layout, zlib-compressed.
  Spec: `papers/format.md` and `papers/newIns.md` in the Furnace repo; the current spec describes a newer layout
  (`INF2`, version 240+) that released Furnace builds may not read.
- Pattern and macro encoding is byte-identical to Furnace's own output (round-trip tested on the NES demos in `references/`).
- Block order as Furnace writes it: header, `INFO`, `FLAG` per chip, three `ADIR`, `INS2`…, `WAVE`…, `PATN`….
- The per-channel byte the spec calls "hide status" is a **show mask: write 3**. Writing 0 hides every channel in the
  GUI (the song still plays).
- The `EN` instrument feature has no length field.
- Fixed (absolute) arpeggio macro values are `0x40000000 | note`; arp and pitch macros are stored as 32-bit.
- A chip's flag pointer may be 0 (no `FLAG` block), as Furnace does for SCC+.
- Wavetable block: name, width, reserved 0, **max value 255**, then 32-bit samples 0..255.
- Chips used: NES `0x06` (5 channels), Konami SCC+ `0xB4` (5 channels, all independent; on the plain SCC `0xA1` channels
  4 and 5 share a waveform). NES instruments are type 34, SCC instruments type 18 with a `wave` macro holding the wavetable index.
- With two chips the channel order is NES 0-4 (pulse 1, pulse 2, triangle, noise, DPCM), then SCC 5-9.

### Pitch (**measured**)

- **Furnace's A-3 is 440 Hz** on pulse and SCC channels: a note sounds one octave above its name in standard terms.
- The NES triangle sounds an octave below a pulse, so a triangle note sounds at the true pitch of its name.
- Lowest pulse note is Furnace "A-0" (55 Hz).
- Write parts in true pitch and shift pulse and SCC notes down 12.
- NES pitch resolution is coarse in high registers: around 1 kHz one period step is about 15 cents, so small pitch
  macros come out as audible steps.
- Pitch macro units: ±32 measured as about ±20-25 cents on a pulse near 1 kHz.

### Timing

- Speed 6 at 60 Hz with virtual tempo `bpm/150` gives 16th-note rows at that bpm (150 bpm = no scaling).
- **Instrument macros run at 60 Hz regardless of virtual tempo.** Macro length in seconds = steps × speed / 60.
- 8th-note triplets inside 16th rows: three notes on rows r, r+1, r+2 with `ED00 / ED02 / ED04` (ticks 0, 8, 16 of 24).
  The drums need the same delays to play along.
- `ECxx` cuts a note after xx ticks; 3 of 6 gives the stuttery 16ths.

### Levels (**measured**, same note, volume 15)

- Triangle: no volume control, about 8200. It is the loudest thing in every file.
- NES pulse 50%: about 4900. SCC+ wave at chip volume 1.0: about 3900; we use SCC chip volume 1.4.
- Pads have to peak near 15 to stand next to the triangle.
- Bass + triangle kick + noise drums at chip volume 1.0 peak near full scale on their own (9500 + 14900 + 11400).
  Adding SCC chords on top clipped; chip volumes NES 0.7 / SCC 0.85 worked. Check the mix peak, not only the channels.
- Noise with the default layout: register = 15 - (note & 15), so a higher note is a higher pitch; C-4 + k gives pitch k.

### Effects confirmed to work as expected

`00xy` arpeggio (and `E0xx` arp speed), `03xx` portamento (also on SCC and triangle; macros are not restarted),
`04xy` vibrato, `E5xx` detune (80 = centre), `ECxx` cut, `EDxx` delay, `0Bxx` jump, volume column.

## Sound recipes

- **Stuttery pulse bass:** 25% pulse, volume `15 15 14 13 12 11 10 10 9`, arp macro `12 0`
  (one-tick octave blip), every 16th cut with `EC03`. Kick: noise kick plus a triangle note with a falling arp macro.
- **Noise drums:** kick = fixed arp `8 4 2 1 0`, fast decay; snare = `13 10 9`; hat = `14`, four-tick decay; crash = `15 14 14`, long decay.
- **Pad swell:** volume `2 3 5 7 8 10 12 13 15 15 14 13 12 11 10 9 8 7 6` at speed 12-14 (about 3.8 s), then holds.
- **Tape wow:** looping pitch macro `0 8 16 24 32 24 16 8 0 -8 … -8` at speed 4-5; give the second voice the inverted macro.
- **Echo on a spare channel:** the same notes 3-4 rows later at volume 5-6.
- **SCC waves** that worked: sine, triangle, saw, square, three pulse widths, organ, hollow, bell, reed, half-sine,
  notched saw, sine+octave, bright/mid/dull (for morphing), 4-bit crushed saw and sine.
  - width "PWM": a looping `wave` macro stepping through pulse12 / 25 / 37 / square;
  - morph: a non-looping `wave` macro bright → mid → dull, so a held note darkens.
- **Passing chord before a slow pad:** play it with a quick-attack instrument (`5 7 8 8 7 7 6 6`, speed 3),
  and start the following chord at level 5 instead of 1; otherwise the resolution falls into a dip.
- **Freeing a channel:** one pulse can carry two chord tones in turn (first half / second half of the chord).
