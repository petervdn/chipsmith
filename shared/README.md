# shared/

What the server and the page both know: the shape of a clip and a song (docs/architecture.md, "The model").
Nothing here reads files or touches the page.

- `api.types.ts`: what the server's routes answer with and take
- `catalogue.types.ts`: the status and the tags songs and clips share
- `chips.ts`: the chips a song can be made for, by name, in the order their channels come
- `chord-numerals.ts`: a chord as a Roman numeral (♭VI, ii7), read, written and named in a key
- `clip-channels.ts`: a clip's channels named from its chips, and whether it can be split
- `clip.types.ts`: a clip, what it was made from and what slice of the music it is
- `guide.types.ts`: a style guide, and a guide as it was sent with a prompt
- `harmony-prompt.ts`: a harmony as the lines of a prompt that ask for it, and as one short line
- `harmony-settings.ts`: a harmony's settings (chords, colour, changes, bass, cadences, key change) and their options
- `harmony.types.ts`: a song's harmony as a prompt asks for it: key, settings, a progression per part
- `job.types.ts`: a job: a prompt on its way to songs, its phases and notes
- `lead-ins.ts`: how one section can lead into the next (drums, bass, harmony, lead, all), and how a prompt asks for each
- `modes.ts`: the notes and modes a key can be in, and each mode's own chords
- `progression-notation.ts`: a progression written short (i ♭VI V:½), read and written
- `progression-presets.ts`: the progressions a part can start from, by the modes they fit
- `song-length.ts`: how long a song is, from its blocks and its clips' lengths
- `song.types.ts`: a song: tracks of blocks that point to clips
- `structure-notation.ts`: a structure written short (A8 A'8 B8), read and written; how a section stands to those before
- `structure-presets.ts`: the structures every prompt can start from
- `structure-prompt.ts`: a structure as the lines of a prompt that ask for it
- `structure.types.ts`: a song's structure: its sections, saved and sent
