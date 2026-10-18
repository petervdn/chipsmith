# shared/

What the server and the page both know: the shape of a clip and a song (docs/architecture.md, "The model").
Nothing here reads files or touches the page.

- `api.types.ts`: what the server's routes answer with and take
- `catalogue.schema.ts`: the status and the tags songs and clips share
- `chips.ts`: the chips a song can be made for, by name, in the order their channels come
- `chord-numerals.ts`: a chord as a Roman numeral (♭VI, ii7), read, written and named in a key
- `clip-notes.schema.ts`: a clip's notes as the note grid edits them: each pitched channel as one run of rows
- `clip-label.ts`: a clip's name as it is shown: its section and stem, or "whole"
- `clip-channels.ts`: a clip's channels named from its chips, and whether it can be split
- `clip-lineage.ts`: a clip's lineage, the clips it was made from: whether a variation is among them, the channels a take keeps
- `clip.schema.ts`: a clip, what it was made from and what slice of the music it is
- `guide.schema.ts`: a style guide, and a guide as it was sent with a prompt
- `harmony-prompt.ts`: a harmony as the lines of a prompt that ask for it, and as one short line
- `harmony-words.ts`: a harmony's feels and colours in plain words, and how a prompt asks for each
- `harmony.schema.ts`: a song's harmony as a prompt asks for it: scale, feel, colour, a progression kept per part
- `job-stages.ts`: a job's compose steps and stages in order, values the page goes through at run time
- `job.schema.ts`: a job: a prompt on its way to songs, its phases and notes
- `lead-ins.ts`: how one section can lead into the next (drums, bass, harmony, lead, all), and how a prompt asks for each
- `modes.ts`: the notes and modes a key can be in, how each mode sounds, and its own chords
- `progression-notation.ts`: a progression written short (i ♭VI V:½), read and written
- `progression-presets.ts`: the progressions offered to hear and keep, by the modes and feels they fit
- `reference.schema.ts`: a reference: a song someone else wrote in Furnace, to listen to and write notes on
- `song-length.ts`: how long a song is, from its blocks and its clips' lengths
- `song.schema.ts`: a song: tracks of blocks that point to clips
- `structure-notation.ts`: a structure written short (A8 A'8 B8), read and written; how a section stands to those before
- `structure-presets.ts`: the structures every prompt can start from
- `structure-prompt.ts`: a structure as the lines of a prompt that ask for it
- `structure.schema.ts`: a song's structure: its sections, saved and sent
- `ticks.ts`: ticks to a beat, the grid a song's blocks are placed on
