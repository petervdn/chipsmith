# 0024. A clip's facts are read from its source.fur, not stored

- Status: accepted
- Date: 2026-10-17

## Context
clip.json held, besides what only it can say (prompt, name, parent, tags, status…), what the clip's
source.fur already says: its tempo, beats to a bar, chips, the channels that play, and its length.
Kept twice, they had to be kept right: `channels` was added later and filled in at every start for
clips made before, and a split copied the whole clip's length and Furnace version into clips whose
audio was not rendered yet. The code guidelines now keep a fact in one place.

## Decision
clip.json holds a clip's record (`ClipRecord`, `shared/clip.types.ts`): what no file of it can say.
Its facts (`ClipFacts`: bpm, beats, chips, channels, seconds) are read from its source.fur by
`getClipFacts` (`make/fur-file-facts.ts`) when the server reads the clip, and are never written.
The length is the song's rows at its speed; for all 101 clips there were, it is within 35 ms of the
rendered audio's. `furnace` stays in the record, as no file says which Furnace rendered the audio:
it is null until the audio is rendered, and written then.

## Alternatives
- **Keep the facts in clip.json**, filled in once. A clip never changes, so they cannot go stale by
  an edit, but every new fact needs a fill-in for the clips before it, and every clip made by
  copying another (a split, a variation) has to be put right field by field.
- **The length from the audio** (its FLAC header). Exact for what plays, but a clip has no audio
  until it is rendered, and a split's clips must be drawn before.

## Consequences
- Reading every clip reads its source.fur: 45 ms for 101 clips, so a few seconds at thousands. A
  clip without a source.fur cannot be read; every clip there is has one.
- The length assumes a song that plays every row once at its speed, as this project's writer makes
  them. A source with jumps or speed changes in its patterns would need them followed.
- The facts left in clip.json files from before were taken out (`examples/` in git, and the data
  folder); `server/clip-channels.ts`, which filled in `channels`, is gone.
