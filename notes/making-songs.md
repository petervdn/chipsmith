# Making songs from a prompt

For Claude running a job (started from the app; the user is not at the terminal). The job's prompt names
its id, `jNNNN`. Your work is one file: **`jobs/<id>/script.ts`**, a script that makes the songs. The
app builds it, renders every song and puts them in the songs list; you do not write clips or songs.

## What to do

1. Read `CLAUDE.md` (musical direction, working rules) and the section of
   `notes/feedback-by-style.md` for the style asked. Facts about Furnace, sound recipes and
   composition lessons: `notes/furnace-howto.md` (written for the old Python tools; the facts hold).
2. Before each step, say in one short line what you are about to do. The user sees these lines live.
3. Write `jobs/<id>/script.ts`, starting from `make/example-script.ts`.
4. Check it: `node make/check-script.ts jobs/<id>/script.ts`. It builds and renders every song once
   and prints its length, peak and the gain that brings the peak to 0.75. Set the chips' volumes
   (`chipVolumes`) from it and check again. That is the whole check, unless something new needs more
   (`node fur/dump.ts <file.fur> --ins --pat CHANNEL,ORDER` shows a module).
5. End with a short reply: what you made and anything the user should know.

Work quickly: a set is minutes, not half an hour of measuring.

## The script

```ts
import type { SongPlan } from '../../make/song-plan.ts';
import { buildModule } from '../../make/module-builder.ts';

export default function makeSongs(): SongPlan[] {
  return [{ title, key, tags, module: buildModule({ … }) }, …];
}
```

- **`title`**: short and telling, as the songs list shows it.
- **`key`**: e.g. `"D minor"`, or null.
- **`tags`**: from the list below, a style and what stands out (two to four).
- **`module`**: from `buildModule` (`make/module-builder.ts`): `chips` (`'nes'` or `'nes+scc'`),
  `bpm`, `beatsPerBar`, `rowsPerBeat` (4: a row is a 16th), and `channels`: one list of rows per chip
  channel for the whole song (NES: pulse 1, pulse 2, triangle, noise, DPCM; then SCC+ 1-5).
  Repeated stretches are reused as patterns by the builder.
- Rows (`fur/fur.types.ts`): `{ note, instrument, volume, effects }`, any left out. Notes from
  `getNoteValue('D-3')` (`fur/notes.ts`); `NOTE_OFF` ends one.
- Instruments: `makeInstrument(name, NES_INSTRUMENT, macros)` (`fur/instrument.ts`): `vol`, `arp`,
  `duty`, `wave`, `pitch` macros; `ARP_FIXED + n` makes a fixed note (drums on the noise channel).
  SCC waves: `makeWavetable(samples)`, 32 samples 0-255.
- Imports are relative to `jobs/<id>/` and name their file with its extension.

## Defaults

- **40 s per song** unless the prompt says otherwise; **one song** unless it asks for more.
- **Pitch**: Furnace's A-3 is 440 Hz on pulse and SCC; the triangle sounds an octave below a pulse.
  Write in true pitch and shift pulse/SCC notes down 12.
- **A set has real variety**: meter, tempo, groove, form and texture differ between its songs, not only
  notes. Before writing, list per song what differs.

## Tags

Use these words (a new one only when none fits):
- style: `action`, `heroic`, `fugue`, `funk`, `boombap`, `nes-groove`, `tide`, `slow-chords`, `ambient`
- what stands out: `dark`, `bright`, `harsh`, `soft`, `stutter`, `walking-bass`, `breakbeat`,
  `swing`, `odd-meter`, `arpeggio`, `chromatic`
