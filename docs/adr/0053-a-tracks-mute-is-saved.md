# 0053. A track's mute is saved with the song

- Status: accepted
- Date: 2026-10-22

## Context
Mute and solo were the view's, kept while the song's page was open and lost on a reload. A track
kept in a song only to be heard now and then (the whole song beside its channels, a take set aside)
came back unmuted every time.

## Decision
- A track has `isMuted` in song.json (`shared/song.schema.ts`; older files: not muted). Muting is an
  edit of the song like its fader: an undo step, saved with Save, undone by Revert.
- Solo stays the view's (`use-track-mix.ts`), not saved: it is for listening for a moment.

## Alternatives
- **Mute in the browser's preferences, per song.** Saved without Save, but only in that browser,
  and apart from the song it belongs to.
- **A track at its quietest level instead of muted.** No new field, but the fader's level is lost
  and the track still plays, at the bottom of the fader's range.

## Consequences
▶ outside the editor (a song's row, the player bar) plays a song as saved: its muted tracks not
heard and each other at its fader's level. Before, it played every track as rendered, the faders
heard only in the editor.

Exporting with "as mute and solo are set" leaves a saved mute out; "All tracks" still has every
track.
