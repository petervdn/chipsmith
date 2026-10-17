# src/editor/

The song editor on an opened song's page: the timeline of its tracks and blocks, playing from a
cursor, the zoom, and the selected block's clip.

- `BlockDetails.css`: the look of BlockDetails.tsx
- `BlockDetails.tsx`: the selected block: where it plays, its clip, its prompt and versions
- `clip-peaks.ts`: a clip's waveform as peaks, from its samples
- `SongEditor.css`: the look of SongEditor.tsx
- `SongEditor.tsx`: the editor: ▶ / ■ and zoom, the timeline, the selected block's details
- `Timeline.css`: the look of Timeline.tsx
- `Timeline.tsx`: the ruler, a row per track with its blocks and repeats, the playhead
- `timeline.ts`: where blocks lie in ticks, the bars shown, which bars are numbered
- `use-element-width.ts`: an element's width, kept current
- `use-playhead-line.ts`: the playhead moved every frame while the song plays
- `use-song-transport.ts`: playing the song from its cursor, stopping, moving the cursor
- `use-zoom.ts`: the pixels to a bar: fitted, or zoomed in and out
- `versions.ts`: a clip's line of versions, oldest first
- `Waveform.css`: the look of Waveform.tsx
- `Waveform.tsx`: a slice of a clip's waveform on a canvas
