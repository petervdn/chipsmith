# 0033. Furnace's demos are references: their own kind, listened to and noted, never songs

- Status: accepted
- Date: 2026-10-17

## Context
Furnace's demo songs (`references/furnace/demos/`) show how people who can hear write for the
chips. The user listens to them and writes what they like; Claude can later study what was liked in
the .fur. How they come into the app, and how far that goes, was open.

## Decision
- A reference is a kind of its own, in the data folder (`references/r0001/`): the .fur copied,
  Furnace's text export of it (`-txtout`), its first subsong rendered once through as a mix and as
  a FLAC per channel (`-outmode perchan`), and reference.json (where it came from, when, and the
  user's notes). Imported by `npm run import-references`, which leaves a demo imported before.
- Only demos whose chips are all ones whose channels the app can name (the NES with its Famicom
  expansions, the SID, the SCC with the AY beside it, a PCM DAC) and that play on the NES, the SID
  or the SCC.
- Its facts (name, author, chips, channels, subsongs) are read from its text export when the
  server reads it, and its length from its FLAC's header; none are stored beside them.
- A References page lists them under NES, SID and SCC; a reference's page has ▶ for its mix and for
  each channel alone (the one player), and one box for the user's notes, written as they type.
- Nothing is drawn from the notes yet: no findings, no rules, no study jobs. The notes are the
  user's words until they say what to do with them (docs/improving-songs.md).

## Alternatives
- **Import them as songs** (a song of one whole clip). The app's own reader reads only the .fur it
  writes (format 223, one subsong, no expansion chips); a song is made by a prompt and is edited;
  and others' music would mix with the user's in the lists and counts.
- **Read them with the app's own .fur reader, extended to every version and chip.** Furnace's text
  export gives every pattern, instrument and macro of any .fur it reads, at no cost.
- **Show them in the song editor** (a track per channel, mute and solo). More to build, and needs
  clip facts the reader cannot give; the per-channel files give hearing a channel alone without it.
- **Render on demand when a reference is opened.** Less disk (a reference is 20-30 MB of FLAC), but
  a wait when it is first opened and state to show while it renders.

## Consequences
The references take a few hundred MB to a GB of the data folder. A demo with more than one subsong
is heard by its first only. Notes are free text; a later step may turn them into findings, skill
text or a guide, each with the user's go.
