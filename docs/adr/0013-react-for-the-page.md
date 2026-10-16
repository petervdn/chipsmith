# 0013. The page is React

- Status: accepted
- Date: 2026-10-16

## Context
unknown-game has no framework and no runtime dependency (0012). This app's page is lists with
filters, a timeline of blocks, playback state and panels that change with a selection.

## Decision
The page is React, the user's choice. What can be worked out without the page stays in plain modules
beside the components, with their tests.

## Alternatives
- **No framework, as the game.** One style across both projects, but more hand-written code for the
  editor's interactive parts.

## Consequences
React and React DOM are the app's two runtime dependencies.
