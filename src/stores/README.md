# src/stores/

Zustand stores, one per concern, for state that is the whole app's or would otherwise be passed
through many layers (docs/adr/0017). Persisted ones use the persist middleware; components never touch
storage.

- `confirm-store.ts`: the question the page asks before a change, and its answer (not persisted)
- `new-song-store.ts`: what New was left at: the builder's parts and locks, the harmony, the structure (not persisted)
- `player-store.ts`: the one player: which song, loading or playing, where (not persisted)
- `preferences-store.ts`: the mute switch, the look, the volume, following the playhead, the track names' width (localStorage)
- `saved-settings.ts`: the persisted stores put back as a first visit has them
