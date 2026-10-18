# fur/

Furnace files (.fur), written and read, as this project writes them (format version 223, old INFO
layout, one subsong, NES / PSG / SCC / SCC+ / SID). The port of the old project's Python tools
(docs/adr/0002); `round-trip.test.ts` holds it to the .fur files they wrote. Any other .fur (the
references) is read through Furnace's own text export.

- `block.ts`: a block of a .fur file, and the format version written
- `bytes.ts`: little-endian bytes, written and read
- `channel-rows.ts`: a channel as one run of rows, its notes read out and written back
- `cut.ts`: a .fur cut by channel: the channels that play, and a channel's own .fur
- `demo-chips.ts`: the chips a reference may play on: labels, channels' names, the app's chip each goes with
- `dump.ts`: a .fur file as text, to see what is in it (`node fur/dump.ts file.fur`)
- `fur.types.ts`: what a .fur file holds, in memory (`FurFile`)
- `furnace-text.ts`: what Furnace's text export of any .fur says: name, author, chips, channels, subsongs
- `instrument.ts`: an instrument (INS2) and a wavetable (WAVE)
- `notes.ts`: pattern note values and their names
- `pattern.ts`: a pattern's rows, packed and unpacked
- `read.ts`: a .fur file read into memory
- `sid.ts`: a SID instrument's settings (its `64` feature), written and read
- `tracker-text.ts`: a whole .fur file as text, as the tracker shows it: orders of patterns side by side
- `transpose.ts`: a .fur with the notes of some channels moved by semitones
- `write.ts`: what is in memory written as a .fur file
