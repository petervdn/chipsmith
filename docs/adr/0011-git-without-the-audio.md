# 0011. Git holds everything but the audio rendered from a source

- Status: accepted
- Date: 2026-10-16

## Context
The project had no version control. A clip's audio is rendered from its .fur; with thousands of clips
it would be gigabytes, and git never forgets what it once held.

## Decision
The project is a git repository. Everything is in it except `clips/*/audio.flac`, which the server
renders again from `source.fur` when it is missing (clip.json says which Furnace version made it). A
clip with no source (audio brought in from elsewhere) has a `.gitignore` of its own with
`!audio.flac`, so its audio is in git. The state before the restart is the branch `archive`; its
audio is in the folder `chiptune-archive` beside this one, outside git.

## Alternatives
- **The audio in git.** A complete history, at the cost of a repository that only grows.
- **Git LFS.** Needs git-lfs and a host that serves it.

## Consequences
A fresh checkout has no audio until it is rendered. A disk backup saves the time a render takes.
