# 0043. A song's transport and ruler stay in view at the top; no player bar on its page

- Status: accepted; stopping the song itself on open superseded by 0045
- Date: 2026-10-18

## Context
On a song's page, play and stop were small buttons among the editor bar's options, and the ruler,
where a tap sets where play starts, was at the top of the timeline. Below a few tracks, the mixer
or a block's details, both had scrolled out of view, and the only way back was to scroll up. The
player bar at the bottom also had ▶ / ■ for the same song, through the same player, but with other
behaviour (■ kept the place, with no cursor), so there were two transports that did not agree.

## Decision
- ■ and ▶ / ❚❚ are the editor's transport, large at the left of its bar, apart from the options,
  with the time beside them. ■ stops and goes back to the cursor; ■ again goes back to the start.
- The bar and the timeline's head (the ruler, the loop row, the structure row) stick under the
  top bar while the page scrolls. The head is drawn apart from the tracks, in a box of its own
  kept scrolled sideways with theirs, because a box that scrolls sideways also catches sticking:
  a ruler inside the tracks' box would stick to that box, not to the page.
- On a phone, where the bar's groups wrap to several rows, only the transport and the ruler stick;
  the groups scroll away.
- A song's page has no player bar, and opening it stops whatever plays, so the editor starts
  stopped at the start and its transport is the only one. The bar's mute moves to the mixer's
  master strip there.

## Alternatives
- **The player bar as the one transport**, made to work as the editor's, with only the ruler
  sticky at the top. Always in view without sticking, and under the thumb on a phone; but at the
  bottom of the screen, far from the timeline it plays.
- **■ and ▶ in the ruler's corner**, above the track names, sticking with the ruler as one row.
  Compact, but the names can be 64 px narrow, too little for two buttons, and it splits the
  transport from the time and the loop.
- **Keep the player bar on a song's page**, stopping any song from the editor's ■. Two controls for
  one player, and a song from another page playing under an editor that shows it stopped.

## Consequences
The editor's head takes about 130 px at the top of a desktop's screen and some 140 px under the top
bar on a phone. The timeline's head and tracks are two components (`TimelineHead.tsx`,
`Timeline.tsx`) that must be drawn at the same sizes (`getTimelineSizes`) and scrolled together
(`use-scroll-sync.ts`); a row added to the head goes in `TimelineHead.tsx`. Leaving a song's page
while it plays shows it in the player bar on the next page, as before.
