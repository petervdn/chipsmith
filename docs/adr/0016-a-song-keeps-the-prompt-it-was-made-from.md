# 0016. A song keeps the prompt it was made from; prompting it again sends only that

- Status: accepted
- Date: 2026-10-17

## Context
A song's music is in its clips, and each clip carries the prompt that made it (0004). A new song is
one clip, so its prompt is the song's; but once a part is changed by a later prompt ("make the B bass
busier"), its clips carry different prompts, and "prompt this song again" would have to put them
together into one confusing new prompt.

## Decision
- song.json holds `prompt`: the prompt the song was made from, as written, set when the song is made
  and never changed. The clips keep their own prompts as before.
- "Prompt again" on a song sends that prompt only. The new songs hold `promptedFrom`, the id of the
  song whose prompt was sent again; the other direction is worked out, not stored.
- When any clip of a song was made by another prompt than the song's, the song is shown as changed
  after its prompt, on its row and when it is prompted again.
- Songs from before this decision got their prompt from their one clip.

## Alternatives
- **Prompts only on clips, a song showing all of them.** A song of many changed parts has no one
  prompt to send again.
- **The link to a re-prompt on the new clips** (`promptedFrom` as a clip id, tried for an hour). The
  prompt sent again is the song's, so the link is the song's.

## Consequences
A clip-level "another take of this clip's prompt" would be a link of its own on the clip, if the
editor gets that; a variation of a clip keeps its `parent` (0014).
