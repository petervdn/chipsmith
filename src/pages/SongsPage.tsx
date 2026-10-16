// The songs list, the start page: every song with its length, tempo, meter, tags and status, the
// filter bar above it, ▶, ★ / ✕ and ⌄ (more) on each row, and a line for each job on its way. A
// row's title opens the song.
import { useEffect, useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { JobStrip } from '../JobStrip.tsx';
import { isJobRunning } from '../jobs-data.ts';
import type { Status } from '../../shared/catalogue.types.ts';
import type { SongListing } from '../../shared/api.types.ts';
import type { Song } from '../../shared/song.types.ts';
import { FilterBar } from '../FilterBar.tsx';
import { PlayButton } from '../PlayButton.tsx';
import { formatMeter, formatSeconds } from '../format.ts';
import type { ListFilter } from '../list-filter.ts';
import { EMPTY_FILTER, getTagCounts, isShown } from '../list-filter.ts';
import { sendChange, useServerData } from '../server-api.ts';
import { SongRowDetails } from '../SongRowDetails.tsx';
import { StatusButtons } from '../StatusButtons.tsx';
import { UndoBar, useUndo } from '../UndoBar.tsx';

type SongsPageProps = { jobs: Job[] };

/** The songs list, with a line for each job on its way above it. */
export function SongsPage({ jobs }: SongsPageProps) {
  const { data: listings, error, reload } = useServerData<SongListing[]>('/api/songs');
  const madeCount = jobs.flatMap((job) => job.songs).filter((song) => song.songId).length;
  useEffect(() => reload(), [madeCount, reload]);
  const [filter, setFilter] = useState<ListFilter>(EMPTY_FILTER);
  const [undoOffer, setUndoOffer] = useUndo();
  const [openSongs, setOpenSongs] = useState<string[]>([]);
  const titlesById = new Map((listings ?? []).map(({ song }) => [song.id, song.title]));

  function toggleOpen(songId: string): void {
    setOpenSongs((open) =>
      open.includes(songId) ? open.filter((id) => id !== songId) : [...open, songId],
    );
  }
  const items = (listings ?? []).map((listing) => ({
    listing,
    text: listing.song.title,
    tags: listing.song.tags,
    status: listing.song.status,
  }));
  const shown = items
    .filter((item) => isShown(item, filter))
    .sort((first, second) => second.listing.song.updated.localeCompare(first.listing.song.updated));

  async function setStatus(song: Song, status: Status): Promise<void> {
    await sendChange(`/api/songs/${encodeURIComponent(song.id)}`, { status });
    reload();
    if (status === 'rejected' && !filter.isShowingRejected) {
      setUndoOffer({
        text: `Rejected "${song.title}"; it is hidden now.`,
        undo: () => void setStatus(song, song.status),
      });
    }
  }

  return (
    <section className="list-page">
      {jobs.filter(isJobRunning).map((job) => (
        <JobStrip key={job.id} job={job} />
      ))}
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
        {shown.map(({ listing }) => {
          const { song, seconds } = listing;
          const isOpen = openSongs.includes(song.id);
          return (
            <li key={song.id}>
              <div className="item-row has-play has-expand">
                <PlayButton songId={song.id} />
                <span className="item-main">
                  <a
                    className="item-title item-link"
                    href={`/songs/${encodeURIComponent(song.id)}`}
                  >
                    {song.title}
                  </a>
                  <span className="item-tags">{song.tags.map((tag) => tag.name).join(' · ')}</span>
                </span>
                <span className="item-facts">
                  <span>{formatSeconds(seconds)}</span>
                  <span>{Math.round(song.bpm)} bpm</span>
                  <span>{formatMeter(song.beats)}</span>
                </span>
                <StatusButtons
                  status={song.status}
                  onChange={(status) => void setStatus(song, status)}
                />
                <button
                  type="button"
                  className={`row-expand${isOpen ? ' is-open' : ''}`}
                  onClick={() => toggleOpen(song.id)}
                  title={isOpen ? 'less' : 'more: the prompt, prompt again, details'}
                  aria-expanded={isOpen}
                >
                  ⌄
                </button>
              </div>
              {isOpen && <SongRowDetails listing={listing} titlesById={titlesById} />}
            </li>
          );
        })}
      </ul>
      <UndoBar offer={undoOffer} onClose={() => setUndoOffer(null)} />
    </section>
  );
}
