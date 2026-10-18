# server/

The app's server, run inside Vite's (docs/architecture.md, "The server"). The files under the data folder's
`clips/` and `songs/` are the data; the server holds a copy of them in memory and writes every change
back to its file (docs/adr/0006).

- `api.ts`: the Vite plugin: the routes of `/api/` and `/media/`
- `claude-log.ts`: a Claude run's log read as it grows: notes, what it is doing now, its result
- `claude-words.ts`: what Claude does said in a step's words: a tool call, a stretch of thinking
- `claude-run.ts`: Claude Code started headless for a job, detached, its output into claude.log
- `clip-files.ts`: a clip's .fur given out: downloaded, as tracker text, or a copy opened in Furnace
- `clip-routes.ts`: `/api/clips`: the pool listed, a clip's record changed, its .fur opened in Furnace, a take deleted
- `examples.ts`: the example songs copied into an empty data folder
- `guides.ts`: the style guides in memory and in guides/<id>/guide.json
- `http.ts`: answering a request: JSON, plain text, a file with byte ranges or as a download, an error
- `job-prompt.ts`: what a job's Claude is told: its prompt, what comes before it, the tools it may use
- `job-routes.ts`: `/api/jobs`: the jobs listed, a prompt sent as a job, a job cancelled or removed
- `job-runner.ts`: a job's way from prompt to songs: compose, build, render
- `jobs.ts`: the jobs in memory and in jobs/<id>/job.json
- `missing-audio.ts`: clips with a source and no audio, rendered when the server starts
- `store.ts`: the clips and songs in memory, read from their folders and written back to them
- `structure-routes.ts`: `/api/structures`: the saved structures listed, made, changed, deleted
- `structures.ts`: the saved structures in memory and in structures/<id>/structure.json
- `take-deletion.ts`: deleting a take: whether it can go, and it replaced in songs and as a parent, then deleted
