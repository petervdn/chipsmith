# src/songs/header/

A song's header on its page, between its title and the editor: its facts, its prompt and what the
prompt was sent with, in five layouts to compare (the ones not chosen are deleted once one is).

- `CardHeader.css`: the look of CardHeader.tsx
- `CardHeader.tsx`: layout 5: no card, the tempo, meter and length large, every other fact in a grid, the prompt under a hairline
- `FactList.css`: the look of FactList.tsx
- `FactList.tsx`: facts with their labels, as tiles, rows, pills, a grid, or a few large
- `HeaderLayoutSwitch.css`: the look of HeaderLayoutSwitch.tsx
- `HeaderLayoutSwitch.tsx`: prev and next through the header's layouts, and the one shown
- `PillsHeader.css`: the look of PillsHeader.tsx
- `PillsHeader.tsx`: layout 3: the facts as pills, the prompt as a quote
- `SectionsHeader.css`: the look of SectionsHeader.tsx
- `SectionsHeader.tsx`: layout 4: sections under hairlines: the song’s facts, then the prompt beside what it was sent with
- `SongHeader.css`: what the layouts share: the label over a part
- `SongHeader.tsx`: the header in the layout chosen, and the list of layouts
- `song-summary.ts`: what the header shows, as labelled facts: the song's, and what its prompt was sent with
- `StatsHeader.css`: the look of StatsHeader.tsx
- `StatsHeader.tsx`: layout 1: the facts as tiles over the prompt
- `TableHeader.css`: the look of TableHeader.tsx
- `TableHeader.tsx`: layout 2: the prompt in a card beside a table of the facts
