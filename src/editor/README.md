# src/editor/

The song editor on an opened song's page: the timeline of its tracks and blocks, edited as a draft and
saved, playing from a cursor, the zoom, and the selected block's clip or track.

- `block-drag.ts`: where a dragged block goes: moved on the grid and between tracks, or trimmed
- `BlockDetails.css`: the look of BlockDetails.tsx
- `BlockDetails.tsx`: the selected block: where it plays, its clip, its prompt and versions
- `clip-peaks.ts`: a clip's waveform as peaks, from its samples
- `grid.ts`: the snap grid: its steps, and a time snapped to one
- `song-edits.ts`: the edits of the arrangement: move, trim, repeat, duplicate, remove a block; tracks
- `SongEditor.css`: the look of SongEditor.tsx
- `SongEditor.tsx`: the editor: its bar of controls, the timeline, the selected block's or track's details
- `Timeline.css`: the look of Timeline.tsx
- `timeline.ts`: where blocks lie in ticks, the bars shown, which bars are numbered
- `Timeline.tsx`: the ruler, a row per track with its blocks, the playhead
- `TimelineBlock.css`: the look of TimelineBlock.tsx
- `TimelineBlock.tsx`: a block and its repeats on the timeline, dragged and trimmed
- `track-mix.ts`: which tracks are heard, by mute and solo
- `TrackDetails.css`: the look of TrackDetails.tsx
- `TrackDetails.tsx`: the selected track: its name, remove
- `use-block-drag.ts`: dragging blocks: a mouse at once, a finger after holding still
- `use-editor-keys.ts`: the editor's keys: Space, Delete, ⌘Z, ⇧⌘Z, ⌘S, Escape
- `use-element-width.ts`: an element's width, kept current
- `use-playhead-line.ts`: the playhead moved every frame while the song plays
- `use-song-draft.ts`: the song being edited: a draft with undo and redo, the selection, save and revert
- `use-song-transport.ts`: playing the song from its cursor, stopping, moving the cursor
- `use-track-mix.ts`: the tracks muted and soloed while editing
- `use-wheel-zoom.ts`: scrolling over the timeline zooms it, about the moment under the pointer
- `use-zoom.ts`: the pixels to a bar: fitted, or zoomed in and out
- `versions.ts`: a clip's line of versions, oldest first
- `Waveform.css`: the look of Waveform.tsx
- `Waveform.tsx`: a slice of a clip's waveform on a canvas
