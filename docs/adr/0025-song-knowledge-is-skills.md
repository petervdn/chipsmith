# 0025. How songs and instruments are made is in skills

- Status: accepted
- Date: 2026-10-17

## Context
What Claude needs to make a song was in `notes/`: `making-songs.md` (a job's steps, the script) and
`furnace-facts.md` (the file format, measured pitch and levels, effects and sound recipes, all
chips together). The names said little, and the chips' knowledge would grow with every chip added
(SID next), in one file read whole each time.

## Decision
It is in project skills (`.claude/skills/`), from the music to the chip, each naming the next:
- **write-song**, where a job starts: the prompt and its style guides, the structure sent with it,
  what sections do, writing for a few voices, variety in a set. Chip-free, and craft, not taste
  (taste is in the style guides, out of git).
- **furnace-song**: writing it down as a .fur file: the job's script, the builder, rows and tempo,
  pitch, the effects all chips share, macros, the check, tags.
- **nes-chip**, **scc-chip**: per chip, its channels, instruments, idioms, levels and the sounds that
  worked. A new chip is a new skill.

A job's Claude is told to use write-song and may use the Skill tool; Claude in a working session
finds them too. The .fur format, which is for the code and not for making songs, is in
`docs/fur-format.md`.

## Alternatives
- **Notes files, renamed and split per chip.** The same layout, but read only when a prompt names
  them; skills are offered to Claude by their descriptions.
- **Song, then instrument, then the chip's instrument** (create-song → create-instrument →
  create-nes-instrument), the first layout, the same day. It mixed the job, the music and Furnace in
  one skill, and a chip is more than its instruments: its idioms and effects too.

## Consequences
`notes/` is gone. A skill holds what was verified and what worked, marked so; how it sounds is the
user's to say.
