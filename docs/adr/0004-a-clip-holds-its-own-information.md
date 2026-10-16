# 0004. A clip holds all of its own information, even what others repeat

- Status: accepted
- Date: 2026-10-16

## Context
One prompt can make several clips at once (a song split into sections and stems). A first design
kept the prompt and the source in a shared record, and each clip pointed to it. The user rejected that:
a clip should be understood from itself.

## Decision
A clip's folder holds everything about it: its audio, its own copy of the .fur and of the script that
wrote it, and in clip.json its prompt as written, its slice (bars and chip channels), its name, its
parent, its tags and status. Clips made together repeat the prompt; `promptId` only groups them and is
never looked up.

## Alternatives
- **A shared record per prompt, clips pointing to it.** Less repetition, but a clip cannot be read,
  copied or kept without the record.

## Consequences
A clip folder can be copied, moved or read alone. The repetition costs a few kilobytes a clip.
