# 0037. A change to a clip is a take, swapped into its block

- Status: accepted; the note grid's direction superseded by 0041
- Date: 2026-10-18

## Context
A song's block should be changeable in the simplest way, on a phone too: a prompt on it ("make the
bass busier", "three new versions of this bassline"), a quick operation (an octave up), or a few
notes moved by hand, without a full tracker. Each result must be easy to try against the others in
the song and to swap back. 0014 decided which blocks a new version replaces; this decides how
versions are made and chosen.

## Decision
- **A change is asked of a clip**, whatever it holds and however a block uses it: a trim or repeats
  are the block's and do not limit the change. Every change makes new clips, variations of it
  (`parent: { clip, relation: 'variation' }`, each with its `variationLabel`, 0036): takes.
- **A prompt on a clip** is a job on that clip: Claude gets the clip's script and its .fur as text,
  the song's prompt and the new prompt, and writes as many takes as asked (1 to 5), each with its
  label. Each is built, cut to the clip's channels (`fur/cut.ts`, as a split is) and rendered. A
  take keeps the clip's tempo, and its length unless the prompt asks for another; the check fails
  otherwise. No song is made.
- **Operations** (an octave up or down, a transpose) change the clip's .fur directly, without
  Claude, and render a take labelled by the operation. Noise and DPCM channels are left out; each
  chip's range is kept.
- **A note grid**, for one channel at a time (a chip channel plays one note at a time): time down
  the screen, pitch across, a selected note moved by buttons (a semitone, an octave, a row, its
  length, removed). Try renders it as a take. A later prompt on such a clip works from its .fur, as
  its script no longer wrote it.
- **Choosing**: the selected block shows its clip's line of versions as pills (the original and
  every take, by label; those rendering striped). A tap puts that take in the block, a draft like
  any edit (0022); the block keeps its start, trim and repeats. Auditioning loops the block's bars,
  solo or in the mix, and a take tapped while it plays is heard from the next pass. Other blocks
  playing the same clip are offered the take (0014).
- Built in that order: the prompt and the pills first, then the operations, then the grid; each adds
  only a way to make a take.

## Alternatives
- **A change bound to the block** (only its trimmed bars changed, the rest copied back). A clip is
  the music; how a block plays it is the arrangement's.
- **Takes as songs**, each a song to compare. Comparing would mean leaving the song, and the other
  tracks would not play with it.
- **A full tracker or piano roll in the page.** Too much for a phone, and most changes are a prompt
  or one operation; the grid edits notes only.

## Consequences
Every way of changing a clip ends in the same kind of thing, a labelled variation, chosen the same
way. Takes not chosen are clips no song plays, left for the clean-up still to build. Not known yet:
whether the audio engine can swap a block's clip while it plays.

## Addendum (2026-10-18)
A takes job was sent with the song's style guides without showing them. Now Change this clip shows
the guides as chips, as New does: the song's own (those that still exist) chosen at first, and only
the ones chosen go along (`guideIds`, as for songs).

## Addendum (2026-10-18): a clip selected shows its family, a block chooses its take
A clip selected in the clips column showed the takes as pills, and a tap on one asked to put it in
every block of the clip: looking at a clip changed the song. Now a clip selected shows what it is
and its family tree (each take under the clip it was made from; a tap shows another, nothing in
the song changes), and a take made of it (a transposition, edited notes) is only shown. Choosing
the take a block plays is the block's: its pills, under "Plays". The clips column shows takes of
takes indented under the take they were made from, as the clips record it (`parent`).
