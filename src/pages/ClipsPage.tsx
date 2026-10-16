// The clip pool: every clip with its name, its prompt, its length and the songs that use it, the
// filter bar above it, and ★ / ✕ on each row.
import { useState } from 'react';
import type { ClipListing } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.types.ts';
import type { Clip } from '../../shared/clip.types.ts';
import { FilterBar } from '../FilterBar.tsx';
import { formatSeconds } from '../format.ts';
import type { ListFilter } from '../list-filter.ts';
import { EMPTY_FILTER, getTagCounts, isShown } from '../list-filter.ts';
import { sendChange, useServerData } from '../server-api.ts';
import { StatusButtons } from '../StatusButtons.tsx';

/** A clip's name as the list shows it: its section and stem, or "whole" for an unsplit clip. */
export function getClipLabel({ name }: Clip): string {
  const label = [name.section, name.stem].filter(Boolean).join(' ');
  return label || 'whole';
}

/** The clips list. */
export function ClipsPage() {
  const { data: listings, error, reload } = useServerData<ClipListing[]>('/api/clips');
  const [filter, setFilter] = useState<ListFilter>(EMPTY_FILTER);
  const items = (listings ?? []).map((listing) => ({
    listing,
    text: `${getClipLabel(listing.clip)} ${listing.clip.prompt} ${listing.clip.id}`,
    tags: listing.clip.tags,
    status: listing.clip.status,
  }));
  const shown = items
    .filter((item) => isShown(item, filter))
    .sort((first, second) => second.listing.clip.created.localeCompare(first.listing.clip.created));

  async function setStatus(clipId: string, status: Status): Promise<void> {
    await sendChange(`/api/clips/${encodeURIComponent(clipId)}`, { status });
    reload();
  }

  return (
    <section className="list-page">
      <FilterBar
        filter={filter}
        onChange={setFilter}
        tagCounts={getTagCounts(items)}
        placeholder={`Search ${items.length} clips…`}
      />
      {error && <p className="error">{error}</p>}
      {listings && items.length === 0 && <p className="empty">No clips yet.</p>}
      <ul className="item-list">
        {shown.map(({ listing: { clip, usedBy } }) => (
          <li key={clip.id}>
            <div className="item-row">
              <span className="item-main">
                <span className="item-title">
                  {getClipLabel(clip)} <span className="item-id">{clip.id}</span>
                </span>
                <span className="item-prompt">{clip.prompt}</span>
              </span>
              <span className="item-facts">
                <span>{formatSeconds(clip.seconds)}</span>
                <span>{Math.round(clip.bpm)} bpm</span>
                <span>
                  in {usedBy.length} {usedBy.length === 1 ? 'song' : 'songs'}
                </span>
              </span>
              <StatusButtons
                status={clip.status}
                onChange={(status) => void setStatus(clip.id, status)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
