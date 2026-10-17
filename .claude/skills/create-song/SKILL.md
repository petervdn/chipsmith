---
name: create-song
description: Make chiptune songs for a chipsmith job as a script of .fur files (NES, SCC+). Use when a job's prompt asks for songs, or when writing or changing a song's music, patterns, effects or mix in this project.
---

# Create a song

For Claude running a job (started from the app; the user is not at the terminal). The job's prompt
names its id, `jNNNN`, the script's file (`<data>/jobs/<id>/script.ts`), the data folder (`<data>`,
holding `songs/` and `clips/`) and how the script imports the project's modules. Your work is that
one file, a script that makes the songs. The app builds it, renders every song and puts them in the
songs list; you do not write clips or songs. You run in the project folder; so do the commands below.

Instruments: the **create-instrument** skill, and for each chip **create-nes-instrument** and
**create-scc-instrument**.

## What to do

1. Read `CLAUDE.md` (working rules). The prompt may come with **style guides**, each under its
   name: they are part of the prompt, and win over any default of yours (the prompt's own words win
   over a guide).
2. Before each step, say in one short line what you are about to do. The user sees these lines live.
3. Write the script, starting from `make/example-script.ts`.
4. Check it: `node make/check-script.ts <data>/jobs/<id>/script.ts`. It builds and renders every song
   once and prints its length, peak and the gain that brings the peak to 0.75. Set the chips' volumes
   (`chipVolumes`) from it and check again. That is the whole check, unless something new needs more
   (`node fur/dump.ts <file.fur> --ins --pat CHANNEL,ORDER` shows a .fur file).
5. End with a short reply: what you made and anything the user should know.

Work quickly: a set is minutes, not half an hour of measuring.

## The script

The imports go from the script's folder to the project folder (`<to project>`: the prompt says it,
e.g. `../../..`):

```ts
import type { SongPlan } from '<to project>/make/song-plan.ts';
import { buildFurFile } from '<to project>/make/fur-file-builder.ts';

export default function makeSongs(): SongPlan[] {
  return [{ title, key, tags, furFile: buildFurFile({ … }) }, …];
}
```

- **`title`**: short and telling, as the songs list shows it.
- **`key`**: e.g. `"D minor"`, or null.
- **`tags`**: from the list below, a style and what stands out (two to four).
- **`furFile`**: from `buildFurFile` (`make/fur-file-builder.ts`): `chips` (`'nes'` or `'nes+scc'`),
  `bpm`, `beatsPerBar`, `rowsPerBeat` (4: a row is a 16th), and `channels`: one list of rows per chip
  channel for the whole song (NES: pulse 1, pulse 2, triangle, noise, DPCM; then SCC+ 1-5).
  Repeated stretches are reused as patterns by the builder.
- Rows (`fur/fur.types.ts`): `{ note, instrument, volume, effects }`, any left out. Notes from
  `getNoteValue('D-3')` (`fur/notes.ts`); `NOTE_OFF` ends one.
- Imports are relative to the script's folder and name their file with its extension.

## Defaults

- **40 s per song** unless the prompt says otherwise; **one song** unless it asks for more.
- **A set has real variety**: meter, tempo, groove, form and texture differ between its songs, not
  only notes. Before writing, list per song what differs.

## Pitch (measured)

- **Furnace's A-3 is 440 Hz** on pulse and SCC channels: a note sounds one octave above its name in
  standard terms. The NES triangle sounds an octave below a pulse, so a triangle note sounds at the
  true pitch of its name.
- **Write parts in true pitch and shift pulse and SCC notes down 12.**
- Lowest pulse note is Furnace "A-0" (55 Hz).

## Timing

- Speed 6 at 60 Hz with virtual tempo `bpm/150` gives 16th-note rows at that bpm (150 bpm = no
  scaling).
- 8th-note triplets inside 16th rows: three notes on rows r, r+1, r+2 with `ED00 / ED02 / ED04`
  (ticks 0, 8, 16 of 24). The drums need the same delays to play along.
- `ECxx` cuts a note after xx ticks; 3 of 6 gives the stuttery 16ths.

## Effects confirmed to work as expected

`00xy` arpeggio (and `E0xx` arp speed), `03xx` portamento (also on SCC and triangle; macros are not
restarted), `04xy` vibrato, `E5xx` detune (80 = centre), `ECxx` cut, `EDxx` delay, `0Bxx` jump, the
volume column.

## The mix (measured)

- Bass + triangle kick + noise drums at chip volume 1.0 peak near full scale on their own (9500 +
  14900 + 11400). Adding SCC chords on top clipped; chip volumes NES 0.7 / SCC 0.85 worked. Check the
  mix peak, not only the channels. Each chip's levels: its instrument skill.

## Arrangement recipes that worked

- **Echo on a spare channel:** the same notes 3-4 rows later at volume 5-6.
- **Passing chord before a slow pad:** play it with a quick-attack instrument (`5 7 8 8 7 7 6 6`,
  speed 3), and start the following chord at level 5 instead of 1; otherwise the resolution falls
  into a dip.
- **Freeing a channel:** one pulse can carry two chord tones in turn (first half / second half of the
  chord).

## Tags

Use these words (a new one only when none fits):
- style: `action`, `heroic`, `fugue`, `funk`, `boombap`, `nes-groove`, `tide`, `slow-chords`, `ambient`
- what stands out: `dark`, `bright`, `harsh`, `soft`, `stutter`, `walking-bass`, `breakbeat`,
  `swing`, `odd-meter`, `arpeggio`, `chromatic`

## A prompt based on a song

A prompt may name songs by id in brackets: `Based on FH 08 [s0042]: more bass, fewer drums`. Start
from that song's music and change what is asked; keep the rest as it is.

- `<data>/songs/<id>/song.json`: its title, its own prompt (what it was asked to be), its tracks and
  the clips its blocks play.
- `<data>/clips/<clip>/`: each clip's `clip.json` (its prompt, key, slice), `source.fur` (its music,
  and its tempo and chips) and `script.ts` (the script that wrote it). A song imported from the old
  project has its import script there, not a composition: work from its `source.fur`. An older script
  uses the old names: `buildModule` (`make/module-builder.ts`), `readModule` and the plan's `module`
  are now `buildFurFile` (`make/fur-file-builder.ts`), `readFurFile` and `furFile`.
- To start from an existing .fur file, read it in your script:
  `readFurFile(readFileSync('<data>/clips/<clip>/source.fur'))` (`fur/read.ts`; scripts run from the
  project folder), change its patterns, instruments or settings, and return it as the plan's
  `furFile`. `node fur/dump.ts <data>/clips/<clip>/source.fur --ins --pat 2,0` shows what is in it.
- A song of several clips is its arrangement: which clip plays where (blocks: start in ticks, 96 to
  a beat, trim, repeats). Work from the clips the change is about.
