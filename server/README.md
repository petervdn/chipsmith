# server/

The app's server, run inside Vite's (docs/architecture.md, "The server"). The files under the data folder's
`clips/` and `songs/` are the data; the server holds a copy of them in memory and writes every change
back to its file (docs/adr/0006).

- `api.ts`: the Vite plugin: the routes of `/api/` and `/media/`
- `app-settings-routes.ts`: `/api/settings`: the app's settings read and changed
- `app-settings.ts`: the app's settings in the data folder (settings.json), read and changed
- `claude-log.ts`: a Claude run's log read as it grows: notes, what it is doing now, its result
- `claude-words.ts`: what Claude does said in a step's words: a tool call, a stretch of thinking
- `claude-run.ts`: Claude Code started headless for a job, detached, its output into claude.log
- `clip-files.ts`: a clip's .fur given out: downloaded, as tracker text, or a copy opened in Furnace
- `clip-routes.ts`: `/api/clips`: the pool listed, a clip's record changed, its .fur opened in Furnace, a take deleted
- `examples.ts`: the example songs copied into an empty data folder
- `guides.ts`: the style guides in memory and in guides/<id>/guide.json
- `http.ts`: answering a request: JSON, plain text, a file with byte ranges or as a download, an error
- `job-knowledge.ts`: the skills and example script a job's Claude is given in full when it starts
- `job-prompt.ts`: what a job's Claude is told: its prompt, what comes before it, the tools it may use
- `job-render.ts`: a run's script built and its songs or takes rendered and made, one at a time
- `job-routes.ts`: `/api/jobs`: the jobs listed, a prompt sent as a job, a job cancelled or removed
- `job-run-state.ts`: a job's runs as job.json keeps them, their files, and what the job shows of them together
- `job-runner.ts`: jobs on their way: up to four Claude runs at once, each run's script rendered as soon as it is done
- `job-runs.ts`: one Claude run of a job: started with its part, followed through its log, picked up again
- `jobs.ts`: the jobs in memory and in jobs/<id>/job.json
- `missing-audio.ts`: clips with a source and no audio, rendered when the server starts
- `store.ts`: the clips and songs in memory, read from their folders and written back to them
- `structure-routes.ts`: `/api/structures`: the saved structures listed, made, changed, deleted
- `structures.ts`: the saved structures in memory and in structures/<id>/structure.json
- `take-context.ts`: what a job of takes is told of its clip, worked out by the server
- `take-deletion.ts`: deleting a take: whether it can go, and it replaced in songs and as a parent, then deleted
