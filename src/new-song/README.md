# src/new-song/

The New page: a prompt written, or made up at random, and sent.

- `NewPage.css`: the look of NewPage.tsx
- `NewPage.tsx`: a prompt for Claude; sending it leads to Jobs
- `PromptBox.css`: the look of PromptBox.tsx
- `PromptBox.tsx`: the box where a prompt is written and sent
- `PromptBuilder.css`: the look of PromptBuilder.tsx
- `PromptBuilder.tsx`: the prompt builder: a row per part with a lock, Roll, Use as prompt
- `random-prompt.ts`: a prompt built from parts: their lists, rolling the unlocked ones, the sentence
- `use-prompt-builder.ts`: the builder's parts and locks
