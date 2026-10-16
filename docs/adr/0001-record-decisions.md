# 0001. Record architecture decisions

- Status: accepted
- Date: 2026-10-16

## Context
The project was restarted on 2026-10-16 after its first form (Python scripts writing batches, a
separate player and song editor) had become hard to find one's way in: three lists of nearly the same
things under different names, and decisions that lived only in a conversation.

## Decision
Decisions that shape the project are written down in `docs/adr/`, one file each, in the format of
unknown-game's (docs/adr/0012).

## Alternatives
- **Only docs/architecture.md.** It says how things are, not why, and a later reader cannot tell a
  choice from an accident.

## Consequences
A decision made in a conversation is not done until its ADR is written.
