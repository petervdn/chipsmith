# The .fur format, as this project writes it

What `fur/write.ts` writes and `fur/read.ts` reads, checked against Furnace. How to make songs and
instruments with it is in the skills (`.claude/skills/`, docs/adr/0025).

- We write format version 223 (Furnace 0.6.8) with the old `INFO` header layout, zlib-compressed.
  Spec: `papers/format.md` and `papers/newIns.md` in the Furnace repo; the current spec describes a
  newer layout (`INF2`, version 240+) that released Furnace builds may not read.
- Pattern and macro encoding is byte-identical to Furnace's own output (round-trip tested on the NES
  demos in `references/`).
- Block order as Furnace writes it: header, `INFO`, `FLAG` per chip, three `ADIR`, `INS2`…,
  `WAVE`…, `PATN`….
- Each channel's name ("channel name" in INFO, a C string after the collapse status) is what the song
  calls it (`channelNames`, "Bass"); empty when the script gives none. The short names are written
  empty.
- The per-channel byte the spec calls "hide status" is a **show mask: write 3**. Writing 0 hides every
  channel in the GUI (the song still plays).
- The `EN` instrument feature has no length field.
- Fixed (absolute) arpeggio macro values are `0x40000000 | note`; arp and pitch macros are stored as
  32-bit.
- A chip's flag pointer may be 0 (no `FLAG` block), as Furnace does for SCC+.
- Wavetable block: name, width, reserved 0, **max value 255**, then 32-bit samples 0..255.
- Chips used: NES `0x06` (5 channels), Konami SCC+ `0xB4` (5 channels, all independent; on the plain
  SCC `0xA1` channels 4 and 5 share a waveform). NES instruments are type 34, SCC instruments type 18
  with a `wave` macro holding the wavetable index.
- With two chips the channel order is NES 0-4 (pulse 1, pulse 2, triangle, noise, DPCM), then SCC 5-9.
- The SID: chip `0x47` (6581) or `0x07` (8580), 3 channels; we write the 6581 with `clockSel=1`
  (PAL). Its instruments are type 3 with a `64` feature after the macros (`NA`, `MA`, `64`, `EN`, as
  Furnace writes them): 9 bytes from version 199 (8 before), laid out in Furnace's papers/newIns.md
  and written by `fur/sid.ts`, held to the C64 demos byte for byte. From version 222 its last byte's
  bit 4 ("reset duty on new note") must be set, or a pulse keeps width 0 and is silent (measured).
- SID macros (codes as the demos use them): `ex1` (5) filter mode, `ex2` (6) resonance, `alg` (8)
  cutoff, `ex4` (15) special (gate, sync, ring, test).
