/**
 * A list's filter kept in the address's query (list-filter.ts), so a reload, the back button and a
 * shared link keep it. The address is replaced as the filter changes, not added to the history. The
 * last query of each list goes to the list memory store, so the top bar's links go back to it.
 */
import { useState } from 'react';
import type { ListFilter } from './list-filter.ts';
import { getFilterFromQuery, getFilterQuery } from './list-filter.ts';
import { useListMemoryStore } from './stores/list-memory-store.ts';

/** The filter of the address, and a setter that writes it back to the address. */
export function useListFilter(): [ListFilter, (filter: ListFilter) => void] {
  const [filter, setFilter] = useState(() => getFilterFromQuery(window.location.search));
  const rememberQuery = useListMemoryStore((memory) => memory.rememberQuery);
  function changeFilter(next: ListFilter): void {
    setFilter(next);
    const query = getFilterQuery(next);
    window.history.replaceState(null, '', `${window.location.pathname}${query}`);
    rememberQuery(window.location.pathname, query);
  }
  return [filter, changeFilter];
}

/** The address of a list with the filter it last had in this tab. */
export function useListAddress(path: string): string {
  const query = useListMemoryStore((memory) => memory.lastQueries[path] ?? '');
  return `${path}${query}`;
}
