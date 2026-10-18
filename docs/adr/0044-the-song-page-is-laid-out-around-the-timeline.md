# 0044. The song page is laid out around the timeline; the tracks shrink to one row in view

- Status: accepted
- Date: 2026-10-18

## Context
The song's clips were a column at the timeline's left and the details of what is selected a column
at its right (or out in the page's margins). The details had grown (a clip's takes, quick changes,
the prompt for takes, the note grid), and the note grid, which runs time across like the timeline,
was squeezed into a side column. The mixer was switched from the editor bar, far from the tracks it
sets. Scrolling down to the details took the tracks out of view, though the transport and ruler
stayed (0043).

## Decision
- The timeline starts at the page's left; the song's clips are a column at its right, kept in view
  under the editor's head.
- The details are under the timeline, as wide as it: the block's section as one bar (it holds a few
  buttons), the clip's section under it in two columns (the clip and its takes, Change this clip),
  the note grid under both, as wide as the timeline.
- The mixer is a row under the tracks that opens and folds from its own head; its switch leaves the
  editor bar.
- The tracks stick under the editor's head too. As the page scrolls on down they shrink, scrolling
  up inside as if the page scrolled them, until one track's row is left, at the height the track
  height slider sets; the room they leave is kept under them so nothing below jumps. A block's
  Show track brings its track into that row.

## Alternatives
- **The block and the clip as tabs.** Hides what the split was made to show, the block and its clip
  together, and costs a tap at every selection.
- **The block and the clip side by side.** The block's few buttons in a narrow column beside a tall
  clip, empty under them.
- **The mixer as a tab of the details.** It would hide whenever a block is selected, but mixing is
  done while listening and selecting.
- **The tracks' box always a fixed height, scrolling inside.** Simpler, but shows fewer tracks than
  fit when the page is at the top.
- **The tracks scrolling out of view** (as before). The transport and ruler stay, but what is
  selected can no longer be seen on its track.

## Consequences
Below the head, one track stays in view whatever is open under it. The tracks' box is sized by
script every scroll (`use-sticky-tracks.ts`, the numbers in `tracks-window.ts`); it is scrolled up
and down only by the page and Show track, not by a hand (the wheel over it zooms). On a phone the
tracks do not stick.
