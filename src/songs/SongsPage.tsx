// The songs list: every song with its length, tempo, meter, tags and status, the
// filter bar above it, ▶, ★ / ✕ and ⌄ (more) on each row, and a line for each job on its way. A
// row's title opens the song.
import { useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { JobStrip } from '../jobs/JobStrip.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import type { Status } from '../../shared/catalogue.types.ts';
import type { Song } from '../../shared/song.types.ts';
import { FilterBar } from '../lists/FilterBar.tsx';
import { PlayButton } from '../player/PlayButton.tsx';
import { formatMeter, formatSeconds } from '../format.ts';
import { getTagCounts, isShown } from '../lists/list-filter.ts';
import { useSetSongStatus, useSongs } from '../queries/songs.ts';
import { useListFilter } from '../lists/use-list-filter.ts';
import { SongRowDetails } from './SongRowDetails.tsx';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { UndoBar, useUndo } from '../lists/UndoBar.tsx';
import { usePageTitle } from '../use-page-title.ts';

type SongsPageProps = { jobs: Job[] };

/** The songs list, with a line for each job on its way above it. */
export function SongsPage({ jobs }: SongsPageProps) {
  const { data: listings, error } = useSongs();
  const { mutateAsync: sendStatus } = useSetSongStatus();
  const [filter, setFilter] = useListFilter();
  const [undoOffer, setUndoOffer] = useUndo();
  const [openSongs, setOpenSongs] = useState<string[]>([]);
  usePageTitle('Songs');
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
    await sendStatus({ songId: song.id, status });
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
      {error && <p className="error">{error.message}</p>}
      {listings && items.length === 0 && (
        <p className="empty">No songs yet. A song appears here as soon as Claude makes one.</p>
      )}
      {items.length > 0 && shown.length === 0 && (
        <p className="empty">No songs match this filter (a song needs every chosen tag).</p>
      )}
      <ul className="item-list">
        {shown.map(({ listing }) => {
          const { song, seconds } = listing;
          const isOpen = openSongs.includes(song.id);
          return (
            <li key={song.id}>
              <div className="item-row has-play has-expand">
                <PlayButton songId={song.id} isWaitingForAudio={listing.isWaitingForAudio} />
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
