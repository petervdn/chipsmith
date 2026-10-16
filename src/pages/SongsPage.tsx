// The songs list, the start page: every song with its length, tempo, meter, tags and status, the
// filter bar above it, and ★ / ✕ on each row. A row opens the song.
import { useState } from 'react';
import type { Status } from '../../shared/catalogue.types.ts';
import type { SongListing } from '../../shared/api.types.ts';
import { FilterBar } from '../FilterBar.tsx';
import { PlayButton } from '../PlayButton.tsx';
import { formatMeter, formatSeconds } from '../format.ts';
import type { ListFilter } from '../list-filter.ts';
import { EMPTY_FILTER, getTagCounts, isShown } from '../list-filter.ts';
import { sendChange, useServerData } from '../server-api.ts';
import { StatusButtons } from '../StatusButtons.tsx';

/** The songs list. */
export function SongsPage() {
  const { data: listings, error, reload } = useServerData<SongListing[]>('/api/songs');
  const [filter, setFilter] = useState<ListFilter>(EMPTY_FILTER);
  const items = (listings ?? []).map((listing) => ({
    listing,
    text: listing.song.title,
    tags: listing.song.tags,
    status: listing.song.status,
  }));
  const shown = items
    .filter((item) => isShown(item, filter))
    .sort((first, second) => second.listing.song.updated.localeCompare(first.listing.song.updated));

  async function setStatus(songId: string, status: Status): Promise<void> {
    await sendChange(`/api/songs/${encodeURIComponent(songId)}`, { status });
    reload();
  }

  return (
    <section className="list-page">
      <FilterBar
        filter={filter}
        onChange={setFilter}
        tagCounts={getTagCounts(items)}
        placeholder={`Search ${items.length} songs…`}
      />
      {error && <p className="error">{error}</p>}
      {listings && items.length === 0 && (
        <p className="empty">No songs yet. A song appears here as soon as Claude makes one.</p>
      )}
      <ul className="item-list">
        {shown.map(({ listing: { song, seconds, clipCount } }) => (
          <li key={song.id}>
            <div className="item-row has-play">
              <PlayButton songId={song.id} />
              <span className="item-main">
                <a className="item-title item-link" href={`/songs/${encodeURIComponent(song.id)}`}>
                  {song.title}
                </a>
                <span className="item-tags">{song.tags.map((tag) => tag.name).join(' · ')}</span>
              </span>
              <span className="item-facts">
                <span>{formatSeconds(seconds)}</span>
                <span>{Math.round(song.bpm)} bpm</span>
                <span>{formatMeter(song.beats)}</span>
                <span>
                  {clipCount} {clipCount === 1 ? 'clip' : 'clips'}
                </span>
              </span>
              <StatusButtons
                status={song.status}
                onChange={(status) => void setStatus(song.id, status)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
