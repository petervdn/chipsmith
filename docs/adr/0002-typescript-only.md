# 0002. TypeScript only; the Python tools are left on the archive branch

- Status: accepted
- Date: 2026-10-16

## Context
The project began in a chat whose sandbox ran Python, and its tools stayed Python: the .fur writer
and reader (`fur.py`, `fur_read.py`, `furdump.py`), rendering, checks, and 37 batch scripts. Nothing
needed Python by then: the tools used only its standard library, and numpy only the old synth. The
app was JavaScript, so the editor's Python helpers reached the app's server over HTTP.

## Decision
The project is TypeScript on Node only. The .fur writer, reader and dump are ported, and the port is
checked by writing the same module with both and comparing the files byte for byte (the Python is on
the `archive` branch). Scripts that compose music are TypeScript too.

## Alternatives
- **Keep the Python tools beside a TypeScript app.** Two languages, two toolchains, and the server
  calling scripts that call the server back.
- **Keep everything Python, the page included.** The page is a browser page; its language is fixed.

## Consequences
One toolchain (npm), types shared by the tools, the server and the page. The composition helpers of
the old scripts (fugue search, grooves, chords) are not ported up front; a piece is ported when a new
song needs it.
