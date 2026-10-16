# render/

A clip's audio: its .fur rendered by Furnace and encoded as FLAC (docs/adr/0007).

- `flac.ts`: a WAV encoded as FLAC, with ffmpeg
- `furnace.ts`: a .fur rendered to a WAV by the Furnace app, one at a time, retried if it fails
- `render-clip.ts`: a clip folder's source.fur rendered to its audio.flac
- `wav.ts`: a WAV's format and length, from its header
