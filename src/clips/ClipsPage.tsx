// The clip pool: every clip with its name, what a variation changed, its length and the songs that use it, the
// filter bar above it, and ★ on each row.
import { getClipLabel } from '../../shared/clip-label.ts';
import { FilterBar } from '../lists/FilterBar.tsx';
import { formatSeconds } from '../format.ts';
import { getTagCounts, isShown } from '../lists/list-filter.ts';
import { useClips, useSetClipStatus } from '../queries/clips.ts';
import { useListFilter } from '../lists/use-list-filter.ts';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { usePageTitle } from '../use-page-title.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import '../lists/lists.css';

/**
 * Shows the clips list, newest first, with the filter bar above it and ★ on each row.
 *
 * @returns The page's section element.
 */
export function ClipsPage() {
  const { data: listings, error } = useClips();
  const { mutate: setStatus } = useSetClipStatus();
  const [filter, setFilter] = useListFilter();
  usePageTitle('Clips');
  const items = (listings ?? []).map((listing) => ({
    listing,
    text: `${getClipLabel(listing.clip)} ${listing.clip.variationLabel ?? ''} ${listing.clip.id}`,
    tags: listing.clip.tags,
    isKept: listing.clip.status === 'keeper',
  }));
  const shown = items
    .filter((item) => isShown(item, filter))
    .sort((first, second) => second.listing.clip.created.localeCompare(first.listing.clip.created));

  return (
    <section className="list-page">
      <Breadcrumbs crumbs={[{ label: 'Clips' }]} />
      <FilterBar
        filter={filter}
        onChange={setFilter}
        tagCounts={getTagCounts(items)}
        placeholder={`Search ${items.length} clips…`}
      />
      {error && <p className="error">{error.message}</p>}
      {listings && items.length === 0 && <p className="empty">No clips yet.</p>}
      {items.length > 0 && shown.length === 0 && (
        <p className="empty">No clips match this filter (a clip needs every chosen tag).</p>
      )}
      <ul className="list">
        {shown.map(({ listing: { clip, usedBy } }) => (
          <li key={clip.id}>
            <div className="list-row">
              <span className="list-main">
                <span className="list-title">{getClipLabel(clip)}</span>
                {clip.variationLabel && (
                  <span className="list-variation">{clip.variationLabel}</span>
                )}
              </span>
              <span className="list-facts">
                <span>{formatSeconds(clip.seconds)}</span>
                <span>{Math.round(clip.bpm)} bpm</span>
                <span>
                  in {usedBy.length} {usedBy.length === 1 ? 'song' : 'songs'}
                </span>
              </span>
              <StatusButtons
                status={clip.status}
                onChange={(status) => setStatus({ clipId: clip.id, status })}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
