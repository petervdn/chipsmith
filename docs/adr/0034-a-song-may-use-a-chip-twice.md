# 0034. A song may use a chip twice

- Status: accepted
- Date: 2026-10-17

## Context
A chip has as many channels as the hardware it emulates (the SCC 5, the SID 3, the NES 5), and a
song used each chip at most once. A song that wanted a sixth wavetable voice (a riff answering two
SCC lines, on a sound of its own) had to give up one of its five, or move to another chip. Furnace
itself lets a song have up to 32 chips, the same one more than once.

## Decision
- A song's chips may name a chip more than once (`['scc', 'scc', 'sid']`): its channels come
  after the first's, the chips in the order NES, SCC, SID as before. The .fur reader, writer and a
  clip's facts already took a list of chips.
- A chip that comes again numbers its channels on (SCC 6-10, SID 4-6), or, for channels not
  numbered, has its count after them ("Pulse 1 (NES 2)").
- On New, a chip's switch goes off, once, twice, off; the prompt says "for two SCCs".
- At most twice from the page; the builder takes any count.

## Alternatives
- **Free a channel** (drop a voice, merge two pads). Loses what the song had.
- **Add another chip** (the NES beside the SCC and the SID). Possible already, but its voices are
  pulses, not the wavetables asked for.
- **Stay with real hardware's limits.** An MSX can hold two SCC cartridges, so two SCCs are not even
  past them; the songs are not bound to real hardware anyway.

## Consequences
Furnace renders a song with two SCC+ and a SID as it should (a riff copied to the second SCC came
out sample for sample as on the first). In the per-channel render, Furnace writes a click into the
first quarter second of each unused SCC channel; the mix has none.
