# 0023. A song's structure is part of the prompt, saved like a style guide

- Status: accepted
- Date: 2026-10-17

## Context
A prompt says what a song should be, but not its form: which parts come back, which return
changed, where something new begins. That form is asked for again and again (AABA, a loop with a
breakdown) and differs by taste.

## Decision
A structure is a list of sections, each a letter and a variant (A, A′, A″) with its bars and, if
wished, a role, an energy and a note; whether a section is new, a variation or a repeat follows from
the letters. It is chosen per prompt on New, from presets in the code or structures saved by the
user (`structures/<id>/structure.json`, like style guides), or written for the prompt alone. What
was sent is copied into the job and the songs it made, and given to Claude as a line per section.
For now it is for making songs only; the editor does not show or change it.

## Alternatives
- **Free text in the prompt.** Already possible, but not reusable, and nothing downstream knows the
  sections.
- **A structure kept on the song and edited in the editor.** Later perhaps: the sections a song was
  made with are its natural places to cut (docs/splitting.md).

## Consequences
Songs and jobs have a `structure` field, null for those made before or without one.
