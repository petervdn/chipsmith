# 0019. Style guides are part of the prompt: chosen per prompt, copied into what it makes

- Status: accepted
- Date: 2026-10-17

## Context
The user's taste (what to keep to per style: harmony, rhythm, sounds, form, what to avoid) lived in
Markdown files that the composing Claude was told to read on every job, picking the section it
thought applied. That was prompt content nobody chose and nothing recorded: a song could not show
what it was made with, and a change to the files silently changed every later job.

## Decision
- **A style guide** is a name and a text (and whether it is chosen by default), in
  `<data>/guides/<id>/guide.json`, made and edited on the Guides page. Unlike a clip it can be
  changed and deleted.
- **On New, the guides are chips**: the default ones chosen to start with, any number chosen.
- **A chosen guide is part of the prompt**: its name and text are copied into the job when the
  prompt is sent, given to Claude under the prompt, and copied into every song and clip the job makes
  (`guides` beside `prompt`, as 0004 and 0016 have it for the prompt). Changing or deleting a guide
  changes only what is sent after.
- **Nothing is carried over**: "Prompt again" and "Use as base" start with the default guides, not the
  song's.
- Nothing is read silently any more: the old guidance files became guides.

## Alternatives
- **Guides read from files on every job** (as before): no choice, nothing recorded.
- **Guides by tag**, matched to the prompt's or the based-on song's tags: tags describe a song and
  would mix two meanings; which guide applied would be a guess.
- **A reference to the guide (and a version) instead of a copy**: smaller, but a deleted or changed
  guide would leave a song that no longer says what it was made from.

## Consequences
A song shows the names of the guides it was made with; its clips hold their text. A clip's files grow
by the text of its guides (a few KB). Carrying guides over to a prompt made from a song, feedback that
flows into a guide, and a guide's history are left for later decisions.
