# 0036. A clip keeps no prompt; a variation says what it changed

- Status: accepted
- Date: 2026-10-18

## Context
Every clip held the prompt it was made with, the guides sent with it and the prompt's id (0004,
0019), so it could be read alone. In practice the prompt was only ever a copy of its song's: a new
song's whole clip has the song's prompt, and a split clip copied its parent's though no prompt made
it. The one rule that read it, a song "changed after its prompt" (0016), compared the two texts.
With prompts on a clip coming (docs/architecture.md, still to build 1), the question was what a clip's prompt is for. A change
is asked of a clip's music, its .fur; how the clip came to sound as it does tells Claude nothing a
look at its events does not, and a chain of prompts ("busier", then "simpler") says nothing reliable
about the result.

## Decision
- A clip keeps no `prompt`, `guides` or `promptId`. The song keeps its prompt, guides, structure
  and harmony (0016, 0019), and the job keeps the prompt as it was sent.
- A clip has `variationLabel`: what a variation changed from its parent ("walking bass", "octave
  up"), written by Claude or the operation that made it and editable by the user
  (`PATCH /api/clips/<id>`). A variation must have one and no other clip may
  (`server/model-checks.ts`). It tells takes apart; it is never sent to Claude and nothing depends
  on it.
- A song is "changed after its prompt" when one of its clips is, or was cut from, a variation
  (`shared/clip-lineage.ts`), not when two texts differ.
- The clip.json files there were rewritten without the three fields (the examples' too).

## Alternatives
- **Keep the prompts (0004 as it was).** Cheap, but the field said "the prompt the music goes back
  to", not "the prompt that made this clip", and a split clip carried a prompt nothing used.
- **Keep only the prompt that made the clip**: a whole clip the song's, a split none, a variation its
  change. Closer to the truth, but the prompt as written still serves only as a label, and a hand
  edit or an operation has no prompt at all.
- **The label inside `parent`** (`{ clip, relation: 'variation', change }`), so a split cannot have
  one. `clip.parent.change` reads as the parent's change; the check holds the rule instead.
- **Names for the field**: `change` (said too little), `label` (`getClipLabel` is the clip's name),
  `note` (a musical note here), `take` (names the clip, not the text).

## Consequences
A clip is still read alone (its audio, .fur, script and record), but no longer says why it was made:
for that, its song or its job. The block's details and the Clips page show a variation's label where
they showed the prompt. 0004's prompt and 0019's copy of the guides into clips are superseded.
