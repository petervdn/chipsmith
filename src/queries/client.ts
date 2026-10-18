/** The page's one TanStack Query client, and the one factory of the keys it caches by (docs/adr/0017). */
import type { QueryKey } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

/** Milliseconds an answer counts as fresh, so pages switching back and forth do not read again. */
const FRESH_FOR = 5000;

/** The query client. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: FRESH_FOR, refetchOnWindowFocus: true } },
});

/** What is cached, one case per kind of read. */
export type QueryKeyParams =
  | { type: 'songs' }
  | { type: 'song'; songId: string }
  | { type: 'clips' }
  | { type: 'jobs' }
  | { type: 'guides' }
  | { type: 'structures' }
  | { type: 'programs' }
  | { type: 'peaks'; clipId: string }
  | { type: 'clipNotes'; clipId: string };

/**
 * Returns the key a read is cached by. A song's key starts with the songs list's, so the list's key
 * with `exact: false` reaches every song too.
 *
 * @param params - The kind of read, and what it reads (a song's or a clip's id) where it needs one.
 * @returns The query key.
 */
export function getQueryKey(params: QueryKeyParams): QueryKey {
  switch (params.type) {
    case 'songs':
      return ['songs'];
    case 'song':
      return ['songs', params.songId];
    case 'clips':
      return ['clips'];
    case 'jobs':
      return ['jobs'];
    case 'guides':
      return ['guides'];
    case 'structures':
      return ['structures'];
    case 'programs':
      return ['programs'];
    case 'peaks':
      return ['peaks', params.clipId];
    case 'clipNotes':
      return ['clipNotes', params.clipId];
    default:
      return getUnknownKey(params);
  }
}

/**
 * Throws for a kind of read the switch above does not handle; called with one, it is a type error.
 *
 * @param params - The kind of read not handled.
 */
function getUnknownKey(params: never): never {
  throw new Error(`no query key for ${JSON.stringify(params)}`);
}
