# Architecture decision records

One short file per decision that shapes the project: what was decided, why, and what was weighed
against it. docs/architecture.md says how things are now; these say why. An accepted ADR is not
rewritten: a later decision that changes it is a new ADR, and the old one's status becomes
"superseded by NNNN". What does change in an old ADR is a name: when a thing is renamed, the ADRs say
the new name.

Write one when a choice was made between real alternatives and someone later would ask "why not the
other way?". Not for bug fixes, tuning or anything the code shows by itself.

Format: `NNNN-what-was-decided.md`, with Status, Date, then Context, Decision, Alternatives,
Consequences.

| # | decision | status |
|---|---|---|
| [0001](0001-record-decisions.md) | Record architecture decisions | accepted |
| [0002](0002-typescript-only.md) | TypeScript only; the Python tools are left on the archive branch | accepted |
| [0003](0003-no-batches.md) | No batches: an exploration makes songs | accepted |
| [0004](0004-a-clip-holds-its-own-information.md) | A clip holds all of its own information, even what others repeat | accepted |
| [0005](0005-clips-are-a-shared-pool.md) | Clips are one shared pool; a song points to clips, and a clip never changes | accepted |
| [0006](0006-the-files-are-the-data.md) | The files are the data; the server holds a copy in memory, no database | accepted |
| [0007](0007-flac-is-the-one-audio-format.md) | FLAC is the one audio format | accepted |
| [0008](0008-tracks-not-channels.md) | A row of the arrangement is a track; a channel is the chip's | accepted |
| [0009](0009-tags-describe-fields-measure.md) | Tags describe, fields measure; a status per song and clip | accepted |
| [0010](0010-a-new-song-is-one-clip.md) | A new song is one whole clip; it is split when it is worked on | accepted |
| [0011](0011-git-without-the-audio.md) | Git holds everything but the audio rendered from a source | superseded by 0018 |
| [0012](0012-standards-of-unknown-game.md) | The setup and coding standards follow unknown-game | accepted |
| [0013](0013-react-for-the-page.md) | The page is React | accepted |
| [0014](0014-a-variation-changes-only-its-block.md) | A new version of a clip changes only the block it was asked for | accepted |
| [0015](0015-render-with-the-furnace-app.md) | A clip is rendered with the Furnace app's command line, one at a time | accepted |
| [0016](0016-a-song-keeps-the-prompt-it-was-made-from.md) | A song keeps the prompt it was made from; prompting it again sends only that | accepted |
| [0017](0017-where-state-lives.md) | Where state lives: local first, then lifted, then a store; the server's in TanStack Query | accepted |
| [0018](0018-what-is-made-is-not-in-git.md) | What is made is never in git; five examples are, and missing audio is rendered on start | accepted |
| [0019](0019-style-guides-are-part-of-the-prompt.md) | Style guides are part of the prompt: chosen per prompt, copied into what it makes | accepted |
| [0020](0020-the-page-is-grouped-by-area.md) | The page is grouped by area; a component's CSS is beside it; no barrel files | accepted |
| [0021](0021-comments-are-full-jsdoc.md) | A function's comment is full JSDoc, checked by the linter | accepted |
| [0022](0022-an-edit-is-a-draft-until-saved.md) | An edit is a draft in the page until it is saved (for now) | accepted |
| [0023](0023-a-structure-is-part-of-the-prompt.md) | A song's structure is part of the prompt, saved like a style guide | accepted |
| [0024](0024-a-clips-facts-are-read-from-its-source.md) | A clip's facts are read from its source.fur, not stored | accepted |
| [0025](0025-song-knowledge-is-skills.md) | How songs and instruments are made is in skills, one per subject and chip | accepted |
| [0026](0026-the-page-shows-its-own-pop-ups.md) | The page shows its own dialogs and tooltips, never the browser's | accepted |
| [0027](0027-icons-from-lucide.md) | The page's icons come from Lucide | accepted |
