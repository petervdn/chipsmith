# src/new-song/

The New page: a prompt written, or made up at random, and sent.

- `ChordAudition.css`: the look of ChordAudition.tsx
- `ChordAudition.tsx`: chords to hear and keep per part: presets that fit the scale and feel, ▶ and keep
- `CreatePanel.css`: the look of CreatePanel.tsx
- `CreatePanel.tsx`: Create and the number of songs, at the right of the prompt, kept in view
- `FoldPanel.css`: the look of FoldPanel.tsx
- `FoldPanel.tsx`: a panel of New: its heading and what is chosen, ▸ opening what changes it
- `HarmonyPanel.css`: the look of HarmonyPanel.tsx
- `HarmonyPanel.tsx`: the Harmony panel: the scale, the key note, the feel, the colour, and chords to hear and keep
- `LeadInEditor.css`: the look of LeadInEditor.tsx
- `LeadInEditor.tsx`: a gap between two sections: how one leads into the next, by voice
- `NewPage.css`: the look of NewPage.tsx
- `NewPage.tsx`: a prompt for Claude; sending it leads to Jobs
- `PartRow.css`: the look of PartRow.tsx
- `PartRow.tsx`: a row of a rolled panel: its label, what is chosen, a die and a lock
- `prompt-words.ts`: the words a built prompt is made of, and what does not go together
- `PromptBox.css`: the look of PromptBox.tsx
- `PromptBox.tsx`: the box where a prompt is written and sent
- `PromptBuilder.css`: the look of PromptBuilder.tsx
- `PromptBuilder.tsx`: the prompt builder: the sentence on top with Roll and Use, a row per part with a lock
- `random-harmony.ts`: the harmony chosen: rolled rows, presets to hear, progressions kept per part, and what is sent
- `random-prompt.ts`: a prompt built from parts: rolling the unlocked ones to go together, the sentence
- `SectionEditor.css`: the look of SectionEditor.tsx
- `SectionEditor.tsx`: a structure's selected section: its part, bars, role, energy, note
- `structure-edits.ts`: a structure's sections added, copied, moved, removed and changed
- `StructurePanel.css`: the look of StructurePanel.tsx
- `StructurePanel.tsx`: the Structure panel: presets, saved and your own; notation, tiles, saving
- `StructureTiles.css`: the look of StructureTiles.tsx
- `StructureTiles.tsx`: a structure's tiles as wide as their bars, and the gaps between them
- `use-harmony-choice.ts`: the harmony chosen for a prompt, its locks, the presets to hear, and what changes it
- `use-progression-preview.ts`: a progression heard, one at a time, and which one plays
- `use-prompt-builder.ts`: the builder's parts and locks
- `use-structure-choice.ts`: the structure chosen for a prompt, edited, saved or deleted
