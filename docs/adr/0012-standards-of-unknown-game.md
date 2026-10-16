# 0012. The setup and coding standards follow unknown-game

- Status: accepted
- Date: 2026-10-16

## Context
The user's other project, unknown-game, has a worked-out TypeScript setup and code guidelines: strict
compiler flags, oxlint, Prettier, Node's own test runner, a file-length limit held by a test, and ADRs.

## Decision
This project takes them over: the same strict tsconfig flags (with `verbatimModuleSyntax` and
`erasableSyntaxOnly` added, so Node runs the TypeScript as it is, and imports written with their
extension, which Node needs where the game's resolve hook found them without), the same oxlint rules, the
same Prettier settings, tests as `<name>.test.ts` beside their module, the 400-line limit and the
README in every source folder (`test/layout.test.ts`), and docs/code-guidelines.md adapted. Left out:
what is the game's alone (the per-frame path, pixels, particles, the renderer), and the ratchet, which
an old codebase needs and a new one does not.

## Alternatives
- **Standards of its own.** Two styles for one reader.

## Consequences
`npm run check` (types, lint, tests, formatting) passes before a commit.
