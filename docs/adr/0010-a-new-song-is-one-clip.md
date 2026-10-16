# 0010. A new song is one whole clip; it is split when it is worked on

- Status: accepted
- Date: 2026-10-16

## Context
A song may be one clip or be cut into clips by bars and chip channels; all are clips of the same kind.
Cutting every new song into sections and stems costs about twenty renders instead of one, and an
exploration should take minutes.

## Decision
How a song is made is said in its prompt: whole, or cut. By default a new song is one whole clip. It
is cut when it is opened to be worked on, or when Claude changes a part of it. The cut clips' parent is
the whole clip, with relation `split`; each has its own partial .fur and is rendered from it.

## Alternatives
- **Cut every new song.** Slow, for songs most of which are heard once.

## Consequences
Listening needs no cut. A clip's audio is always a render of its own .fur, never a piece cut out of a
render of its parent's.
