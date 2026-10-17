# shared/

What the server and the page both know: the shape of a clip and a song (docs/architecture.md, "The model").
Nothing here reads files or touches the page.

- `api.types.ts`: what the server's routes answer with and take
- `catalogue.types.ts`: the status and the tags songs and clips share
- `clip.types.ts`: a clip, what it was made from and what slice of the music it is
- `guide.types.ts`: a style guide, and a guide as it was sent with a prompt
- `job.types.ts`: a job: a prompt on its way to songs, its phases and notes
- `song-length.ts`: how long a song is, from its blocks and its clips' lengths
- `song.types.ts`: a song: tracks of blocks that point to clips
- `structure-notation.ts`: a structure written short (A8 A'8 B8), read and written; how a section stands to those before
- `structure-presets.ts`: the structures every prompt can start from
- `structure-prompt.ts`: a structure as the lines of a prompt that ask for it
- `structure.types.ts`: a song's structure: its sections, saved and sent
