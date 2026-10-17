# 0025. How songs and instruments are made is in skills

- Status: accepted
- Date: 2026-10-17

## Context
What Claude needs to make a song was in `notes/`: `making-songs.md` (a job's steps, the script) and
`furnace-facts.md` (the file format, measured pitch and levels, effects and sound recipes, all
chips together). The names said little, and the chips' knowledge would grow with every chip added
(SID next), in one file read whole each time.

## Decision
It is in project skills (`.claude/skills/`), each a subject, naming the next:
- **create-song**: a job's steps, the script, pitch, timing, effects, the mix, arrangement recipes.
- **create-instrument**: instruments and macros in general, macro recipes.
- **create-nes-instrument**, **create-scc-instrument**: per chip, its channels, levels and the
  sounds that worked. A new chip is a new skill.

A job's Claude is told to use create-song and may use the Skill tool; Claude in a working session
finds them too. The .fur format, which is for the code and not for making songs, is in
`docs/fur-format.md`.

## Alternatives
- **Notes files, renamed and split per chip.** The same layout, but read only when a prompt names
  them; skills are offered to Claude by their descriptions.

## Consequences
`notes/` is gone. A skill holds what was verified and what worked, marked so; how it sounds is the
user's to say.
