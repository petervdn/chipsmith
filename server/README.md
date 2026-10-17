# server/

The app's server, run inside Vite's (docs/architecture.md, "The server"). The files under the data folder's
`clips/` and `songs/` are the data; the server holds a copy of them in memory and writes every change
back to its file (docs/adr/0006).

- `api.ts`: the Vite plugin: the routes of `/api/` and `/media/`
- `claude-log.ts`: a Claude run's log read as it grows: notes, what it is doing now, its result
- `claude-run.ts`: Claude Code started headless for a job, detached, its output into claude.log
- `clip-channels.ts`: the channels of clips made before clips recorded them, filled in
- `examples.ts`: the example songs copied into an empty data folder
- `guides.ts`: the style guides in memory and in guides/<id>/guide.json
- `http.ts`: answering a request: JSON, a file with byte ranges, an error
- `job-runner.ts`: a job's way from prompt to songs: compose, build, render
- `jobs.ts`: the jobs in memory and in jobs/<id>/job.json
- `json-checks.ts`: checks that a value read from JSON is what a type says
- `missing-audio.ts`: clips with a source and no audio, rendered when the server starts
- `model-checks.ts`: a clip.json or song.json read from disk, checked field by field
- `store.ts`: the clips and songs in memory, read from their folders and written back to them
- `structure-checks.ts`: a structure checked where it comes in, section by section
- `structure-routes.ts`: `/api/structures`: the saved structures listed, made, changed, deleted
- `structures.ts`: the saved structures in memory and in structures/<id>/structure.json
