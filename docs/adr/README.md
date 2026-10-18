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
| [0004](0004-a-clip-holds-its-own-information.md) | A clip holds all of its own information, even what others repeat | accepted; its prompt superseded by 0036 |
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
| [0015](0015-render-with-the-furnace-app.md) | A clip is rendered with the Furnace app's command line, one at a time | accepted; the app's binary superseded by 0042 |
| [0016](0016-a-song-keeps-the-prompt-it-was-made-from.md) | A song keeps the prompt it was made from; prompting it again sends only that | accepted; the clips' prompts superseded by 0036 |
| [0017](0017-where-state-lives.md) | Where state lives: local first, then lifted, then a store; the server's in TanStack Query | accepted |
| [0018](0018-what-is-made-is-not-in-git.md) | What is made is never in git; five examples are, and missing audio is rendered on start | accepted |
| [0019](0019-style-guides-are-part-of-the-prompt.md) | Style guides are part of the prompt: chosen per prompt, copied into what it makes | accepted; the guides' copy in clips superseded by 0036 |
| [0020](0020-the-page-is-grouped-by-area.md) | The page is grouped by area; a component's CSS is beside it; no barrel files | accepted |
| [0021](0021-comments-are-full-jsdoc.md) | A function's comment is full JSDoc, checked by the linter | accepted |
| [0022](0022-an-edit-is-a-draft-until-saved.md) | An edit is a draft in the page until it is saved (for now) | accepted |
| [0023](0023-a-structure-is-part-of-the-prompt.md) | A song's structure is part of the prompt, saved like a style guide | accepted |
| [0024](0024-a-clips-facts-are-read-from-its-source.md) | A clip's facts are read from its source.fur, not stored | accepted |
| [0025](0025-song-knowledge-is-skills.md) | How songs and instruments are made is in skills, one per subject and chip | accepted |
| [0026](0026-the-page-shows-its-own-pop-ups.md) | The page shows its own dialogs and tooltips, never the browser's | accepted |
| [0027](0027-icons-from-lucide.md) | The page's icons come from Lucide | accepted |
| [0028](0028-a-song-not-wanted-is-deleted.md) | A song not wanted is deleted, not rejected | accepted; a take's trash can by 0039 |
| [0029](0029-clips-are-not-in-the-top-bar.md) | Clips are not in the top bar; the page stays at its address | accepted |
| [0030](0030-the-structure-asked-for-is-shown-as-sent.md) | The structure a song was asked for is shown as it was sent, above its tracks | accepted |
| [0031](0031-the-loop-is-whole-bars-in-a-row-of-its-own.md) | The editor's loop is whole bars, drawn in a row of its own under the ruler | accepted |
| [0032](0032-a-title-is-unique-its-length-chosen-at-random.md) | A song's title is unique, in a number of words chosen at random | accepted |
| [0034](0034-a-song-may-use-a-chip-twice.md) | A song may use a chip twice | accepted |
| [0035](0035-the-psg-joins-the-sid-leaves-new.md) | The MSX PSG is a chip a song can use; the New page stops offering the SID | accepted |
| [0036](0036-a-clip-keeps-no-prompt.md) | A clip keeps no prompt; a variation says what it changed | accepted |
| [0037](0037-a-change-to-a-clip-is-a-take.md) | A change to a clip is a take, swapped into its block | accepted; the note grid's direction superseded by 0041 |
| [0038](0038-zod-schemas-are-the-source-of-truth.md) | Data that is validated is a Zod schema, and its type is inferred from it | accepted |
| [0039](0039-a-take-not-wanted-is-deleted.md) | A take not wanted is deleted; the take in a block can be updated | accepted |
| [0040](0040-the-note-grid-scrolls-both-ways.md) | The note grid lays out the channel's whole range and scrolls both ways | accepted; its axes superseded by 0041 |
| [0041](0041-the-note-grid-runs-time-across.md) | The note grid runs time across, as the timeline does, and pitch up | accepted |
| [0042](0042-render-with-a-headless-furnace.md) | A clip is rendered with a headless Furnace build; the app only opens files | accepted |
| [0043](0043-the-editors-transport-stays-in-view.md) | A song's transport and ruler stay in view at the top; no player bar on its page | accepted; stopping the song itself on open superseded by 0045 |
| [0044](0044-the-song-page-is-laid-out-around-the-timeline.md) | The song page is laid out around the timeline; the tracks shrink to one row in view | accepted |
| [0045](0045-a-song-playing-plays-on-into-its-page.md) | A song playing when its page opens plays on in the editor | accepted |
| [0046](0046-the-top-bar-is-full-width.md) | The top bar is the window's full width; each page keeps its own width | accepted |
| [0047](0047-a-song-prompt-changes-its-song.md) | A song prompt changes its song as a proposal; the clip prompt stays with the clip until then | accepted (not built yet) |
| [0048](0048-a-songs-actions-are-beside-its-title.md) | A song's actions are beside its title; Revert and Save alone at the right | accepted |
| [0049](0049-a-song-is-exported-as-it-plays.md) | A song is exported as audio as the editor plays it, mixed in the page | accepted |
