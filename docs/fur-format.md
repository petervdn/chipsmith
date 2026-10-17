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
