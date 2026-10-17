# src/jobs/

The jobs: their page, a job's card, and the line of a running one.

- `job-songs.ts`: a job's songs as its card lists them (one for each asked for), and their count
- `job-stages.ts`: a job's stages from start to end, and where it is with each
- `JobStages.css`: the look of JobStages.tsx
- `JobStages.tsx`: a job's stages in a row: done, current, to come, or where it failed
- `job-steps.ts`: a job's steps written alike, and how long each took, with its share of the job
- `JobCard.css`: the look of JobCard.tsx
- `JobCard.tsx`: a job's card on the Jobs page
- `job-totals.ts`: what jobs that are over came to: songs, time, tokens
- `jobs.css`: what the jobs' parts share: the spinner and the time
- `JobsPage.css`: the look of JobsPage.tsx
- `JobsPage.tsx`: every prompt sent, as a card, newest first
- `JobSteps.css`: the look of JobSteps.tsx
- `JobSteps.tsx`: a job's current step, and all its steps with their share of the time
- `JobStrip.css`: the look of JobStrip.tsx
- `JobStrip.tsx`: one line for a running job, above the songs list
