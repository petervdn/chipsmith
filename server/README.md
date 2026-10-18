# server/

The app's server, run inside Vite's (docs/architecture.md, "The server"). The files under the data folder's
`clips/` and `songs/` are the data; the server holds a copy of them in memory and writes every change
back to its file (docs/adr/0006).

- `api.ts`: the Vite plugin: the routes of `/api/` and `/media/`
- `claude-log.ts`: a Claude run's log read as it grows: notes, what it is doing now, its result
- `claude-words.ts`: what Claude does said in a step's words: a tool call, a stretch of thinking
- `claude-run.ts`: Claude Code started headless for a job, detached, its output into claude.log
- `clip-files.ts`: a clip's .fur given out: downloaded, as tracker text, or a copy opened in Furnace
- `clip-routes.ts`: `/api/clips`: the pool listed, a clip's record changed, its .fur opened in Furnace
- `examples.ts`: the example songs copied into an empty data folder
- `guides.ts`: the style guides in memory and in guides/<id>/guide.json
- `http.ts`: answering a request: JSON, plain text, a file with byte ranges or as a download, an error
- `job-prompt.ts`: what a job's Claude is told: its prompt, what comes before it, the tools it may use
- `job-routes.ts`: `/api/jobs`: the jobs listed, a prompt sent as a job, a job cancelled or removed
- `job-runner.ts`: a job's way from prompt to songs: compose, build, render
- `jobs.ts`: the jobs in memory and in jobs/<id>/job.json
- `json-checks.ts`: checks that a value read from JSON is what a type says
- `missing-audio.ts`: clips with a source and no audio, rendered when the server starts
- `model-checks.ts`: a clip.json or song.json read from disk, checked field by field
- `reference-routes.ts`: `/api/references` (listed, notes written) and a reference's audio in `/media/`
- `references.ts`: the references in memory, their facts read from their files, in references/<id>/
- `store.ts`: the clips and songs in memory, read from their folders and written back to them
- `harmony-checks.ts`: a harmony checked where it comes in: its key, settings and progressions
- `structure-checks.ts`: a structure checked where it comes in, section by section
- `structure-routes.ts`: `/api/structures`: the saved structures listed, made, changed, deleted
- `structures.ts`: the saved structures in memory and in structures/<id>/structure.json
