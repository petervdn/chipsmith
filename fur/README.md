# fur/

Furnace .fur modules, written and read, as this project writes them (format version 223, old INFO
layout, one subsong, NES / SCC / SCC+). The port of the Python tools on the `archive` branch
(docs/adr/0002); `check-archive.ts` compares the two.

- `block.ts`: a block of a .fur file, and the format version written
- `bytes.ts`: little-endian bytes, written and read
- `check-archive.ts`: reads and writes again every .fur of the archive, and compares the bytes
- `dump.ts`: a module as text, to see what is in it (`node fur/dump.ts file.fur`)
- `fur.types.ts`: what a module is made of
- `instrument.ts`: an instrument (INS2) and a wavetable (WAVE)
- `notes.ts`: pattern note values and their names
- `pattern.ts`: a pattern's rows, packed and unpacked
- `read.ts`: a .fur file read back into a module
- `write.ts`: a module written as a .fur file
