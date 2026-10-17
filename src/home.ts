/**
 * What the home page shows of the songs: the latest ones and how many there are of each kind. Knows
 * nothing of the page.
 */
import type { SongListing } from '../shared/api.types.ts';

/** How many songs there are, kept, and not heard yet (the rejected left out). */
export type SongCounts = { songCount: number; keeperCount: number; newCount: number };

/** The `count` songs made last, the rejected left out. */
export function getLatestSongs(listings: SongListing[], count: number): SongListing[] {
  return listings
    .filter(({ song }) => song.status !== 'rejected')
    .sort((first, second) => second.song.created.localeCompare(first.song.created))
    .slice(0, count);
}

/** How many songs there are of each kind. */
export function getSongCounts(listings: SongListing[]): SongCounts {
  const statuses = listings
    .map(({ song }) => song.status)
    .filter((status) => status !== 'rejected');
  return {
    songCount: statuses.length,
    keeperCount: statuses.filter((status) => status === 'keeper').length,
    newCount: statuses.filter((status) => status === 'new').length,
  };
}
