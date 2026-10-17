# 0032. A song's title is unique, in a number of words chosen at random

- Status: accepted
- Date: 2026-10-17

## Context
Each job's Claude starts fresh and is not told which titles exist, so a prompt like an earlier one
got an earlier song's title again ("Phrygian Mirrorball", twice). Most titles were two words, as
"short and telling" in the furnace-song skill asked, and several were named after the prompt's
mode.

## Decision
- The job runner chooses each song's title length, 2 to 6 words, each as likely, and gives it in
  the prompt ("Title the songs in this many words, in order: 4, 2, 6."). Chosen in code, because a
  model asked to choose at random does not.
- The check Claude runs while composing (`make/check-script.ts`) fails on a title another song
  already has, or that two songs of the script share, alike but for case and spaces; Claude then
  chooses another in the same number of words.
- The skill asks for a title telling of the song's own image or mood, not the key, mode or chip
  the prompt names.

## Alternatives
- **Give Claude every title made so far in its prompt.** A list that grows with every song, for
  Claude to read and avoid by itself; the check holds without it.
- **Rename a taken title when the song is made** (a number after it). A title nobody chose, made
  after Claude is done; the check lets Claude choose a new one.
- **Ask Claude to vary the length itself.** A model's "random" leans to what it likes; two words
  stayed the most common.

## Consequences
A title is unique when the check runs; a song made by a job whose Claude skipped the check after
renaming could still repeat one. The example script's title is an example song's, so the check
fails on it as it is.
