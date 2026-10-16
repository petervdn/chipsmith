# shared/

What the server and the page both know: the shape of a clip and a song (docs/architecture.md, "The model").
Nothing here reads files or touches the page.

- `api.types.ts`: what the server's routes answer with and take
- `catalogue.types.ts`: the status and the tags songs and clips share
- `clip.types.ts`: a clip, what it was made from and what slice of the music it is
- `song-length.ts`: how long a song is, from its blocks and its clips' lengths
- `song.types.ts`: a song: tracks of blocks that point to clips
