# 0056. A job's Claude is given its skills in full

- Status: accepted
- Date: 2026-10-23

## Context
Every job opened the same way: three turns to load write-song, furnace-song and a chip skill, one
or two to read `make/example-script.ts`, the builder and the job, and often one more in the middle
of composing to look up the `Row` type or what `notes.ts` exports, after which it thought again.
Each turn is a round trip with the whole conversation; the opening took 10 to 22 s (j0053, j0056).

## Decision
- When a job starts, the server reads the composing skills (write-song, furnace-song, and all four
  chip skills, as the prompt may name any chip) and the example script, and puts them in Claude's
  system prompt (`server/job-knowledge.ts`), saying they are given.
- furnace-song lists the API a script uses (the row types, `notes.ts`, `instrument.ts`,
  `buildFurFile`, `SongPlan`, `readFurFile`), so nothing has to be looked up while composing.
- The skill files stay the one source (0025): read fresh for each job, and still loaded as skills
  when working in the project.

## Alternatives
- **Leave it to Claude to load them.** It loads only the chip skill it needs, but in turns of its
  own, and it reads the source for what the skills leave out.
- **Only the skills the prompt's chips need.** The prompt is free text; guessing its chips could
  leave one out. All four are about 3.5k tokens, cached after the first request.

## Consequences
About 9k tokens are in every job's first request, cached for the turns after. A change to a skill
is in the next job without a restart.
