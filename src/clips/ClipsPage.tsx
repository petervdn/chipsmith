// The clip pool: every clip with its name, its prompt, its length and the songs that use it, the
// filter bar above it, and ★ / ✕ on each row.
import type { Status } from '../../shared/catalogue.types.ts';
import type { Clip } from '../../shared/clip.types.ts';
import { FilterBar } from '../lists/FilterBar.tsx';
import { formatSeconds } from '../format.ts';
import { getTagCounts, isShown } from '../lists/list-filter.ts';
import { useClips, useSetClipStatus } from '../queries/clips.ts';
import { useListFilter } from '../lists/use-list-filter.ts';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { UndoBar, useUndo } from '../lists/UndoBar.tsx';
import { usePageTitle } from '../use-page-title.ts';
import '../lists/lists.css';

/**
 * Returns a clip's name as the list shows it.
 *
 * @param clip - The clip.
 * @param clip.name - The clip's name, its section and stem.
 * @returns The section and stem, or "whole" for an unsplit clip.
 */
export function getClipLabel({ name }: Clip): string {
  const label = [name.section, name.stem].filter(Boolean).join(' ');
  return label || 'whole';
}

/**
 * Shows the clips list, newest first, with the filter bar above it and ★ / ✕ on each row.
 *
 * @returns The page's section element.
 */
export function ClipsPage() {
  const { data: listings, error } = useClips();
  const { mutateAsync: sendStatus } = useSetClipStatus();
  const [filter, setFilter] = useListFilter();
  const [undoOffer, setUndoOffer] = useUndo();
  usePageTitle('Clips');
  const items = (listings ?? []).map((listing) => ({
    listing,
    text: `${getClipLabel(listing.clip)} ${listing.clip.prompt} ${listing.clip.id}`,
    tags: listing.clip.tags,
    status: listing.clip.status,
  }));
  const shown = items
    .filter((item) => isShown(item, filter))
    .sort((first, second) => second.listing.clip.created.localeCompare(first.listing.clip.created));

  async function setStatus(clip: Clip, status: Status): Promise<void> {
    await sendStatus({ clipId: clip.id, status });
    if (status === 'rejected' && !filter.isShowingRejected) {
      setUndoOffer({
        text: `Rejected clip ${clip.id}; it is hidden now.`,
        undo: () => void setStatus(clip, clip.status),
      });
    }
  }

  return (
    <section className="list-page">
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
                <span className="list-title">
                  {getClipLabel(clip)} <span className="list-id">{clip.id}</span>
                </span>
                <span className="list-prompt">{clip.prompt}</span>
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
                onChange={(status) => void setStatus(clip, status)}
              />
            </div>
          </li>
        ))}
      </ul>
      <UndoBar offer={undoOffer} onClose={() => setUndoOffer(null)} />
    </section>
  );
}
