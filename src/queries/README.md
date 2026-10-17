# src/queries/

Everything the page reads from or sends to the server, as TanStack Query queries and mutations
(docs/adr/0017). Server data lives in this cache only, never in a store.

- `client.ts`: the query client and `getQueryKey`, the one typed factory of its keys
- `clips.ts`: the clip pool, and changing a clip's status
- `jobs.ts`: the jobs, polled while one runs, and sending a prompt
- `programs.ts`: the check of the programs the app calls
- `request.ts`: a route read as JSON or a change sent
- `songs.ts`: the songs list, one song, and changing a song's status
