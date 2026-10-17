# 0017. Where state lives: local first, then lifted, then a store; the server's in TanStack Query

- Status: accepted
- Date: 2026-10-17

## Context
The page had grown its own ways of keeping state: a fetch hook per page with no shared cache
(`useServerData`), a polling hook for jobs, a module-level player store of its own making, and
components reading and writing localStorage and sessionStorage themselves. None of that was decided;
nothing ruled out libraries (0012 left out the game's no-dependency rule, 0013 chose React).

## Decision
State goes to the first of these that fits:
1. **Local state** (`useState`) in the component that uses it. Always the first choice.
2. **Lifted** to the nearest common parent, when siblings need it, as long as the props stay few.
3. **Context**, for a value that a subtree of the page needs and that changes rarely (the song an
   editor has open, its services); every consumer re-renders on a change, so not for values that move
   (a playhead).
4. **A Zustand store**, when lifting would mean passing props through many layers, or the state is the
   whole app's (the player). One store per concern, each with its actions beside it; a component
   subscribes with a selector to what it uses.
5. **The address**, only for state where navigation matters: what a link, a reload or the back button
   should bring back (a list's filter).

And across all of them:
- **Everything from the server is TanStack Query**: queries for what is read (songs, clips, a song,
  jobs, with polling while a job runs), mutations for what is changed, invalidating what they touch.
  Server data is never copied into a store.
- **Components never touch storage.** State that survives a reload is a store with Zustand's
  `persist` middleware (localStorage, or sessionStorage for a tab's session), persisting only the
  fields that should survive (`partialize`), with a `version` to migrate when its shape changes.
  This holds even for state only one component uses.
- Code outside React (the audio engine) reads a store with `getState()` and `subscribe`.

## Alternatives
- **Hand-made hooks and stores**, as before: each a little different, no cache shared between pages,
  storage handled in several places.
- **Everything in Zustand.** Global state for what one component needs; server data with two sources
  of truth.
- **Context for shared state across the app.** Re-renders every consumer on each change, and nests
  providers for each concern.

## Consequences
TanStack Query and Zustand are runtime dependencies beside React. `useServerData`, `useJobs`, the
player's own store and the components' storage calls are replaced.
