/**
 * What the home page shows of the songs: the latest ones and how many there are of each kind. Knows
 * nothing of the page.
 */
import type { SongListing } from '../../shared/api.types.ts';

/** How many songs there are, kept, and not heard yet. */
export type SongCounts = { songCount: number; keeperCount: number; newCount: number };

/**
 * Returns the songs made last.
 *
 * @param listings - Every song's listing.
 * @param count - How many songs to give at most.
 * @returns Up to `count` listings, the newest first.
 */
export function getLatestSongs(listings: SongListing[], count: number): SongListing[] {
  return [...listings]
    .sort((first, second) => second.song.created.localeCompare(first.song.created))
    .slice(0, count);
}

/**
 * Counts the songs of each kind.
 *
 * @param listings - Every song's listing.
 * @returns How many songs there are, how many are kept and how many are not heard yet.
 */
export function getSongCounts(listings: SongListing[]): SongCounts {
  const statuses = listings.map(({ song }) => song.status);
  return {
    songCount: statuses.length,
    keeperCount: statuses.filter((status) => status === 'keeper').length,
    newCount: statuses.filter((status) => status === 'new').length,
  };
}
