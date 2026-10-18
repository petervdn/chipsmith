# 0040. The note grid lays out the channel's whole range and scrolls both ways

- Status: accepted
- Date: 2026-10-18

## Context
The note grid (0037) put pitch across the screen. It showed 13 pitches at a time (an octave and its
top note) stretched to the box's width, ‹ › moving it an octave, and a note outside them marked at
the edge. On a phone the box scrolled only down. A line that crosses an octave could not be seen
whole, and moving to other pitches jumped by an octave instead of panning.

## Decision
- The grid lays out every pitch from the C an octave below the lowest note's octave to the B an
  octave above the highest note's (the channel as read and as edited), each column 28 px wide, so
  a tap lands on a phone.
- The box scrolls both ways. The pitch names stay at the top and the bar numbers at the left.
- It opens scrolled across to the middle of the channel's notes; when an edit widens the range
  below, the scroll moves with it so the notes stay where they were.
- ‹ › and the marks at the edge are gone: every note is on the grid.

## Alternatives
- **An octave at a time with ‹ ›** (as it was). Fits the width without scrolling sideways, but
  splits a line over pages.
- **Every pitch Furnace plays.** Mostly empty, and the notes have to be found.
- **Columns squeezed to fit the range.** Too narrow to tap once a channel spans two octaves.

## Consequences
The page still never scrolls sideways (docs/code-guidelines.md); only the grid's box does, as the
timeline's does. A grid wider than the screen hides some pitches until scrolled to.
