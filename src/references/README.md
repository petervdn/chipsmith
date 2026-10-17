# src/references/

The References pages: Furnace's demo songs to listen to, channel by channel, and the user's notes on
each (docs/adr/0033).

- `reference-groups.ts`: the references grouped under the app's chips, and a reference's chips as one line
- `ReferencePage.tsx`: one reference: its facts, the notes box, ▶ for its mix and each channel
- `ReferencePlayButton.tsx`: ▶ for a reference's mix or one channel alone
- `references.css`: the look of the References pages
- `ReferencesPage.tsx`: every reference, grouped under NES, SID and SCC
- `use-reference-notes.ts`: a reference's notes as they are written, saved as the user pauses
