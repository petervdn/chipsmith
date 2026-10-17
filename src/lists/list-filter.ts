/**
 * The filter both lists share (songs and clips): words to find, tags that must all be there, and
 * whether rejected ones show. Given an item's text, tags and status, says whether it shows.
 */
import type { Status, Tag } from '../../shared/catalogue.types.ts';

/** What a list is filtered by. */
export type ListFilter = { words: string; tags: string[]; isShowingRejected: boolean };

/** What the filter reads of an item. */
export type FilterableItem = { text: string; tags: Tag[]; status: Status };

/** A filter that shows everything but the rejected. */
export const EMPTY_FILTER: ListFilter = { words: '', tags: [], isShowingRejected: false };

/**
 * Tells whether an item shows under a filter: it is not rejected (unless the rejected show), it has
 * every tag of the filter, and its text and tag names hold every word.
 *
 * @param item - What the filter reads of the item.
 * @param item.text - The item's text, searched for the words.
 * @param item.tags - The item's tags.
 * @param item.status - The item's status.
 * @param filter - The filter.
 * @returns Whether the item shows.
 */
export function isShown({ text, tags, status }: FilterableItem, filter: ListFilter): boolean {
  if (status === 'rejected' && !filter.isShowingRejected) return false;
  const tagNames = tags.map((tag) => tag.name);
  if (!filter.tags.every((name) => tagNames.includes(name))) return false;
  const haystack = `${text} ${tagNames.join(' ')}`.toLowerCase();
  return filter.words
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * Counts every tag the items have.
 *
 * @param items - The items of the list.
 * @returns Each tag's name and how many items have it, most used first, then by name.
 */
export function getTagCounts(items: FilterableItem[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));
}

/**
 * Writes a filter as the address's query: `q` (words), `tags` (comma-separated), `rejected=1`.
 *
 * @param filter - The filter.
 * @param filter.words - The words to find, left out when blank.
 * @param filter.tags - The tags that must all be there.
 * @param filter.isShowingRejected - Whether rejected items show.
 * @returns The query with its leading "?", or an empty string for an empty filter.
 */
export function getFilterQuery({ words, tags, isShowingRejected }: ListFilter): string {
  const query = new URLSearchParams();
  if (words.trim()) query.set('q', words);
  if (tags.length > 0) query.set('tags', tags.join(','));
  if (isShowingRejected) query.set('rejected', '1');
  const text = query.toString().replaceAll('%2C', ',');
  return text ? `?${text}` : '';
}

/**
 * Reads the filter an address's query holds.
 *
 * @param search - The address's query.
 * @returns The filter, with what the query does not say as in EMPTY_FILTER.
 */
export function getFilterFromQuery(search: string): ListFilter {
  const query = new URLSearchParams(search);
  return {
    words: query.get('q') ?? '',
    tags: (query.get('tags') ?? '').split(',').filter(Boolean),
    isShowingRejected: query.get('rejected') === '1',
  };
}
