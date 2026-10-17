/**
 * A list's filter kept in the address's query (list-filter.ts), so a reload, the back button and a
 * shared link keep it. The address is replaced as the filter changes, not added to the history.
 */
import { useState } from 'react';
import type { ListFilter } from './list-filter.ts';
import { getFilterFromQuery, getFilterQuery } from './list-filter.ts';

/** The filter of the address, and a setter that writes it back to the address. */
export function useListFilter(): [ListFilter, (filter: ListFilter) => void] {
  const [filter, setFilter] = useState(() => getFilterFromQuery(window.location.search));
  function changeFilter(next: ListFilter): void {
    setFilter(next);
    window.history.replaceState(null, '', `${window.location.pathname}${getFilterQuery(next)}`);
  }
  return [filter, changeFilter];
}
