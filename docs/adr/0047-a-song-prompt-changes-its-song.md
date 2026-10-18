# 0047. A song prompt changes its song as a proposal; the clip prompt stays with the clip until then

- Status: accepted (not built yet)
- Date: 2026-10-18

## Context
A song's page has a prompt only for a clip: "Change this clip" in the clip's section, which makes
takes of it (0037). Some changes are the song's, not any one clip's: a part added ("add drums", "a
counter-melody in the choruses"), the arrangement changed ("repeat the chorus at the end"), one
change across its clips ("a softer lead everywhere"), something written into some bars ("a fill at
bar 16"). There was no place to ask for them.

## Decision
- A prompt about the whole song changes that song; it never makes a new song. A change of the
  whole thing ("make it jazz") is a new song, through Prompt again or Use as base, as now.
- What it makes comes back as a proposal: the song's tracks with the new clips (new parts on new
  tracks, takes of its clips in their blocks), kept until it is looked at. Heard, it is put in the
  editor as unsaved edits, then saved or reverted; the arrangement as it was is never lost until
  then. Every new piece of audio is a new clip (0005).
- It is one prompt place on the song's page, always visible, its target following the selection:
  the song with nothing selected, the clip with a clip or a block selected, later a track or the
  looped bars; its label and a mark of the target change with it.
- Until the song can be the target, the clip prompt stays in the clip's section. A prompt always
  visible but able to send only with a clip selected was tried as a box above the song's clips and
  left: it is the clip's prompt moved away from the clip.

## Alternatives
- **A song prompt makes new songs based on this one.** Quick (Use as base does it), but every ask
  adds a song to the list and the song being worked on is left behind.
- **A song prompt edits the arrangement and saves it.** Nothing to look at first, and the
  arrangement before is gone: songs have no versions.
- **The always-visible prompt now, for clips only.** See the last point of the decision.

## Consequences
The script needs a new plan shape (new clips and where their blocks go), checked by
`make/check-script.ts`, and the write-song skill a section on it; the new clips follow the song's
tempo and bar grid. A song still one whole clip gains little beyond added parts until it is split.
Where the prompt goes (fixed at the page's bottom, or above the song's clips) is decided when it is
built.
