# src/new-song/

The New page: a prompt written, or made up at random, and sent.

- `CreatePanel.css`: the look of CreatePanel.tsx
- `CreatePanel.tsx`: Create and the number of songs, at the right of the prompt, kept in view
- `LockIcon.tsx`: a small padlock in the text colour, shut or open
- `NewPage.css`: the look of NewPage.tsx
- `NewPage.tsx`: a prompt for Claude; sending it leads to Jobs
- `PromptBox.css`: the look of PromptBox.tsx
- `PromptBox.tsx`: the box where a prompt is written and sent
- `PromptBuilder.css`: the look of PromptBuilder.tsx
- `PromptBuilder.tsx`: the prompt builder: the sentence on top with Roll and Use, a row per part with a lock
- `random-prompt.ts`: a prompt built from parts: their lists, rolling the unlocked ones, the sentence
- `SectionEditor.css`: the look of SectionEditor.tsx
- `SectionEditor.tsx`: a structure's selected section: its part, bars, role, energy, note
- `structure-edits.ts`: a structure's sections added, copied, moved, removed and changed
- `StructurePanel.css`: the look of StructurePanel.tsx
- `StructurePanel.tsx`: the Structure panel: presets, saved and your own; notation, tiles, saving
- `use-prompt-builder.ts`: the builder's parts and locks
- `use-structure-choice.ts`: the structure chosen for a prompt, edited, saved or deleted
