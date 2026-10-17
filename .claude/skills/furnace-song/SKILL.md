---
name: furnace-song
description: Write a chipsmith song down as a Furnace .fur file - the job's script, buildFurFile, rows, tempo, pitch naming, effects, instrument macros, the check run and tags. Use when writing or changing a song's script; the music itself is write-song, each chip's specifics its own skill.
---

# Write a song down in Furnace

The music comes from **write-song**; each chip's channels, instruments and idioms from its skill
(**nes-chip**, **scc-chip**, **sid-chip**). This is how it all becomes a .fur file.

## The job

The job's prompt names its id, `jNNNN`, the script's file (`<data>/jobs/<id>/script.ts`), the data
folder (`<data>`, holding `songs/` and `clips/`) and how the script imports the project's modules.
Your work is that one file, a script that makes the songs. The app builds it, renders every song and
puts them in the songs list; you do not write clips or songs. You run in the project folder; so do
the commands below.

1. Read `CLAUDE.md` (working rules).
2. Write the script, starting from `make/example-script.ts`.
3. Check it: `node make/check-script.ts <data>/jobs/<id>/script.ts`. It builds and renders every song
   once and prints its length, peak and the gain that brings the peak to 0.75. Set the chips' volumes
   (`chipVolumes`) from it and check again. That is the whole check, unless something new needs more
   (`node fur/dump.ts <file.fur> --ins --pat CHANNEL,ORDER` shows a .fur file).

## The script

The imports go from the script's folder to the project folder (`<to project>`: the prompt says it,
e.g. `../../..`), and name their file with its extension:

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
- **`furFile`**: from `buildFurFile` (`make/fur-file-builder.ts`): `chips`, the chips the prompt
  names (`['nes']`, `['sid']`, `['nes', 'scc']`; "for the NES and the SCC" is both), `bpm`,
  `beatsPerBar`, `rowsPerBeat` (4: a row is a 16th), and `channels`: one list of rows per chip
  channel for the whole song, chip by chip as NES, SCC, SID whatever order `chips` is in (each
  chip's channels: its skill). `chipVolumes` follow the same order. Repeated stretches are reused as patterns.
- **`channelNames`**: a short name per channel for what it plays, in the order of `channels`
  (`['Lead', 'Harmony', 'Bass', 'Drums', '']`): one or two words, a role, never the chip's own name
  ("Pulse 1", "SID 2"); `''` for a channel that stays silent. Furnace shows them over the channels,
  and splitting the song into channels names its tracks by them ("Bass · Triangle").
- Rows (`fur/fur.types.ts`): `{ note, instrument, volume, effects }`, any left out. Notes from
  `getNoteValue('D-3')` (`fur/notes.ts`); `NOTE_OFF` ends one.

## Pitch (measured)

- **Furnace's A-3 is 440 Hz** on pulse and SCC channels: a note sounds one octave above its name in
  standard terms. The NES triangle sounds an octave below a pulse, and the SID at its name (A-3 is
  220 Hz).
- **Write parts in true pitch and shift pulse and SCC notes down 12** (not the triangle's, not the
  SID's).

## Timing

- Speed 6 at 60 Hz with virtual tempo `bpm/150` gives 16th-note rows at that bpm.
- 8th-note triplets inside 16th rows: three notes on rows r, r+1, r+2 with `ED00 / ED02 / ED04`
  (ticks 0, 8, 16 of 24). The drums need the same delays to play along.
- `ECxx` cuts a note after xx ticks; 3 of 6 gives stuttery 16ths.

## Effects confirmed to work as expected

`00xy` arpeggio (and `E0xx` arp speed), `03xx` portamento (macros are not restarted), `04xy`
vibrato, `E5xx` detune (80 = centre), `ECxx` cut, `EDxx` delay, `0Bxx` jump, the volume column.
Each chip's own effects: its skill.

## Instruments and macros

- `makeInstrument(name, type, macros)` (`fur/instrument.ts`), given to `buildFurFile` in
  `instruments`; a row plays one by its index. The type and what the macros mean: the chip's skill.
- Macros: `vol`, `arp`, `duty`, `wave`, `pitch`, each `{ kind, values, loop?, release?, speed? }`;
  255 (or left out) is no loop or release.
- **Macros run at 60 Hz regardless of the song's virtual tempo.** Length in seconds = steps × speed
  / 60.
- `arp` values are semitone offsets; `ARP_FIXED + n` makes a fixed note n (drums).
- `pitch` units: ±32 measured as about ±20-25 cents on a pulse near 1 kHz.
- **Pad swell:** volume `2 3 5 7 8 10 12 13 15 15 14 13 12 11 10 9 8 7 6` at speed 12-14 (about
  3.8 s), then holds. **Tape wow:** looping pitch `0 8 16 24 32 24 16 8 0 -8 … -8` at speed 4-5, the
  second voice inverted. **Quick attack:** volume `5 7 8 8 7 7 6 6` at speed 3.

## The mix (measured)

Check the mix's peak, not only each channel's: bass, kick and noise drums at chip volume 1.0 already
peak near full scale on the NES, and SCC chords on top clipped (NES 0.7 / SCC 0.85 worked). Each
chip's levels: its skill.

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
  uses old names: `buildModule` (`make/module-builder.ts`), `readModule` and the plan's `module` are
  now `buildFurFile`, `readFurFile` and `furFile`; its `chips` `'nes'` and `'nes+scc'` are now
  `['nes']` and `['nes', 'scc']`.
- To start from an existing .fur file, read it in your script:
  `readFurFile(readFileSync('<data>/clips/<clip>/source.fur'))` (`fur/read.ts`; scripts run from the
  project folder), change its patterns, instruments or settings, and return it as the plan's
  `furFile`. `node fur/dump.ts <data>/clips/<clip>/source.fur --ins --pat 2,0` shows what is in it.
- A song of several clips is its arrangement: which clip plays where (blocks: start in ticks, 96 to
  a beat, trim, repeats). Work from the clips the change is about.
