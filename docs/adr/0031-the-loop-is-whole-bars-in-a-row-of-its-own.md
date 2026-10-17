# 0031. The editor's loop is whole bars, drawn in a row of its own

- Status: accepted
- Date: 2026-10-17

## Context
Listening to a song while editing it needs a loop: the whole song, or a part of it heard over and
over. How to choose the part was open.

## Decision
- A loop switch beside follow. While it is on, a thin row under the ruler shows the loop as a band:
  its edges are dragged to change it, the band to move it, and a drag over empty space draws a new
  one. It starts as the whole song (to the bar line nearest its end); "whole song" in the row's
  corner goes back to that.
- The loop's edges are whole bars, whatever the snap is set to.
- Each pass is scheduled on the audio clock while the one before plays, on one clock that runs on,
  so the passes join without a gap and the metronome clicks on through them.
- Not saved: it is how the song is listened to, not part of it.

## Alternatives
- **Drag on the ruler to set the loop.** The ruler already moves the play position on a tap or a
  drag; a second meaning for the same gesture needs a modifier key, which a phone does not have.
- **Edges on the snap grid (beats).** The metronome's downbeats would drift on every pass of a loop
  that is not whole bars, and a loop of a part of a bar is rarely what is wanted.
- **Starting again at the loop's start when the end is reached.** Simple, but leaves a gap of the
  play's start delay at every pass.

## Consequences
A loop shorter than a bar cannot be set. A change to the loop while it plays starts it again from
where it is, as an edit does.
