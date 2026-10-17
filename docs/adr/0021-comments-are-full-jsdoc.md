# 0021. A function's comment is full JSDoc, checked by the linter

- Status: accepted
- Date: 2026-10-17

## Context
Comments were a description alone, without `@param` or `@returns` (taken over from unknown-game,
0012), written as clipped phrases ("Where a block's last repeat ends, in ticks; …"). They read
oddly, and what a parameter means (its unit, what null stands for) was folded into one line or left
out.

## Decision
A function's comment is full JSDoc: a sentence saying what it does, a `@param` for every parameter
(the fields of a destructured one too) and a `@returns`, each described; no types in the tags. The
linter's JSDoc rules (`jsdoc/require-param`, `require-returns` and their descriptions) check it in
`npm run check`.

## Alternatives
- **Tags only where the name and type do not say it all.** Less repetition (`@param bpm - The
  song's tempo.`), but every function is a judgement call, and no tool can check "obvious".
- **The description alone**, as before. Short, but it was found ugly and leaves units and meanings
  out.

## Consequences
Every documented function in the project was brought to the rule, a folder at a time. A changed
signature needs its tags changed with it; the linter finds a missing one (a tag left for a removed
parameter it does not find: this oxlint has no `check-param-names`).
