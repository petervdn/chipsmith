/**
 * A list's filter kept in the address's query (list-filter.ts), so a reload, the back button and a
 * shared link keep it. The address is replaced as the filter changes, not added to the history. The
 * last query of each list is also kept for this tab, so the top bar's links go back to it.
 */
import { useState } from 'react';
import type { ListFilter } from './list-filter.ts';
import { getFilterFromQuery, getFilterQuery } from './list-filter.ts';

const LAST_QUERY_KEY = 'chiptune.filter.';

/** The filter of the address, and a setter that writes it back to the address. */
export function useListFilter(): [ListFilter, (filter: ListFilter) => void] {
  const [filter, setFilter] = useState(() => getFilterFromQuery(window.location.search));
  function changeFilter(next: ListFilter): void {
    setFilter(next);
    const query = getFilterQuery(next);
    window.history.replaceState(null, '', `${window.location.pathname}${query}`);
    try {
      sessionStorage.setItem(`${LAST_QUERY_KEY}${window.location.pathname}`, query);
    } catch {
      /* the top bar then links to the list unfiltered */
    }
  }
  return [filter, changeFilter];
}

/** The address of a list with the filter it last had in this tab. */
export function getListAddress(path: string): string {
  try {
    return `${path}${sessionStorage.getItem(`${LAST_QUERY_KEY}${path}`) ?? ''}`;
  } catch {
    return path;
  }
}
