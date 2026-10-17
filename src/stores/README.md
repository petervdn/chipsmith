# src/stores/

Zustand stores, one per concern, for state that is the whole app's or would otherwise be passed
through many layers (docs/adr/0017). Persisted ones use the persist middleware; components never touch
storage.

- `list-memory-store.ts`: the filter each list last had in this tab (sessionStorage)
- `player-store.ts`: the one player: which song, loading or playing, where (not persisted)
- `preferences-store.ts`: the mute switch and the hidden job cards (localStorage)
