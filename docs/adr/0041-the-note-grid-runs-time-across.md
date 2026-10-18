# 0041. The note grid runs time across, as the timeline does, and pitch up

- Status: accepted
- Date: 2026-10-18

## Context
The note grid (0037) ran time down the screen and pitch across, as Furnace's rows do. That fitted
an octave across a phone held upright; once the grid scrolled both ways over the channel's range
(0040), that reason was gone, and the grid ran time the other way from the timeline just above it.

## Decision
- Time runs across, a row 18 px wide, with the bar numbers on a ruler that stays at the top, as in
  the timeline.
- Pitch runs up, the highest at the top, a pitch's line 24 px tall to tap, its name in a column that
  stays at the left.
- It opens at the start, scrolled up or down to the middle of the notes; when an edit widens the
  range above, the scroll moves with it so the notes stay where they were.
- Moving a note in time is "← earlier" and "later →".

## Alternatives
- **Time down, as Furnace's rows** (as it was). Matches the tracker and the text view, but those are
  read in Furnace, not edited beside the timeline.

## Consequences
The grid and the timeline read alike, bars left to right, so they can later share a zoom or a
playhead. A phone held upright shows fewer bars at once than it showed rows.
