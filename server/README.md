# server/

The app's server, run inside Vite's (docs/architecture.md, "The server"). The files under `clips/` and
`songs/` are the data; the server holds a copy of them in memory and writes every change back to its
file (docs/adr/0006).

- `api.ts`: the Vite plugin: the routes of `/api/` and `/media/`
- `claude-run.ts`: Claude Code run headless for a job, and its log read as notes
- `http.ts`: answering a request: JSON, a file with byte ranges, an error
- `job-runner.ts`: a job's way from prompt to songs: compose, build, render
- `jobs.ts`: the jobs in memory and in jobs/<id>/job.json
- `json-checks.ts`: checks that a value read from JSON is what a type says
- `model-checks.ts`: a clip.json or song.json read from disk, checked field by field
- `store.ts`: the clips and songs in memory, read from their folders and written back to them
