# 0059. Bars are taken out of a song in its blocks

- Status: accepted
- Date: 2026-10-23

## Context
"The intro is too long" went to Claude as a job of takes (j0051, two minutes and more). Taking bars
out needs no composing. It could be a take of the clip with the bars cut from its .fur, but a song
split into channels plays a clip per channel: cutting one of them puts it out of step with the
others, and cutting them all is a render per channel.

## Decision
Bars are taken out in the arrangement: with a loop drawn, ✂ in the loop row takes its bars out of
the song (`removeTicks`, `src/editor/bar-cut.ts`). Every block over them is cut there, its whole
repeats kept as repeats and the repeat the cut falls in trimmed; what comes after moves up to close
the gap. It is an edit like any other: undone, saved or reverted. No clip changes and nothing is
rendered.

## Alternatives
- **A take of the clip without the bars.** One clip to hear, but a render, and only for a song
  that is one whole clip.
- **Ask Claude (as before).** It may smooth the join musically, at a job's cost.

## Consequences
The join is where the audio is cut: a note ringing across it is cut too, and a click is possible
(docs/splitting.md, "Cutting in time"). The structure drawn above the timeline is the one sent and
does not follow the cut (0030).
