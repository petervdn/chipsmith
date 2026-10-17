# data/

Where everything made with the app lives: the songs, the clips, the jobs and your guidance. None of it
is in git (only this README is): what you make stays yours. Back this folder up, or make it a git
repository of its own. Another folder can be used instead with `CHIPSMITH_DATA` (README.md,
"Settings").

- `clips/<id>/`: a clip: `clip.json`, its `source.fur`, the `script.ts` that wrote it, its `audio.flac`
- `songs/<id>/song.json`: a song's arrangement of clips
- `jobs/<id>/`: a prompt's job: `job.json`, Claude's log, its script and the modules it built
- `guidance/`: your taste and feedback (Markdown), read by Claude before it composes

When this folder has no clips and no songs, the app starts it with the examples (`examples/`). Audio
that is missing is rendered when the app starts.
