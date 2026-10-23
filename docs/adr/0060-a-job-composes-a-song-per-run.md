# 0060. A job composes each song in a run of its own, and jobs go side by side

- Status: accepted
- Date: 2026-10-23

## Context
One Claude wrote every song of a job in one script, so a job of five songs took about five times
one (j0045: 400 s, 40k output tokens), and the runner took one job at a time: a second prompt
waited for the first to be rendered. Its render also held up following any other job.

## Decision
- A job has a Claude run per song or take asked for (`runs` in job.json, `server/job-runs.ts`),
  each with its own script, log and build folder (the first's the names a job always had). All of a
  job's runs compose at once; each is told its part and how to stand apart from the others it
  cannot see: a song its place from the slowest to the fastest, and a different meter and groove; a
  take what it leans on (the rhythm, the register, the contour, …).
- The runner keeps up to four runs composing across all jobs, oldest job first, and follows them
  every second; a run's script is built and rendered as soon as it has composed, one render at a
  time, in a queue that does not hold up the following (`server/job-runner.ts`,
  `server/job-render.ts`).
- The job shows its runs together: notes named by part, tokens added up, its compose stage the
  least advanced run's, its songs as they come. It is done once all its runs are; a failed run
  fails only its part; the job fails when nothing is made.

## Alternatives
- **One run for all the songs (as before).** The songs are planned together and differ by design,
  but the time grows with their number.
- **A first short run that plans the songs, then one run each.** Planned variety, at the cost of a
  run before any composing and a plan to hand over.
- **No limit on runs.** Faster for a big job, but many at once may meet the account's rate limits.

## Consequences
Songs of one job no longer see each other: their variety rests on the parts they are given. A
job's cost is about the same, its runs' prompts sent once each. Four Claude runs may compose at once.
