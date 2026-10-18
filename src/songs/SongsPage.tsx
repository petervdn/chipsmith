// The songs list: every song with its length, tempo, meter, tags and status, the filter bar above
// it, ▶, ★, a trash can and ⌄ (more) on each row, and a line for each job on its way. A row's title
// opens the song.
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Job } from '../../shared/job.schema.ts';
import { JobStrip } from '../jobs/JobStrip.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import type { Song } from '../../shared/song.schema.ts';
import { FilterBar } from '../lists/FilterBar.tsx';
import { PlayButton } from '../player/PlayButton.tsx';
import { formatMeter, formatSeconds } from '../format.ts';
import { getTagCounts, isShown } from '../lists/list-filter.ts';
import { groupByTime } from '../lists/time-groups.ts';
import { useNow } from '../lists/use-now.ts';
import { useDeleteSong, useSetSongStatus, useSongs } from '../queries/songs.ts';
import { useListFilter } from '../lists/use-list-filter.ts';
import { SongRowDetails } from './SongRowDetails.tsx';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { askToConfirm } from '../stores/confirm-store.ts';
import { usePageTitle } from '../use-page-title.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import '../lists/lists.css';
import './SongsPage.css';

type SongsPageProps = { jobs: Job[] };

/**
 * Shows the songs list, newest first, with a line for each job on its way above it.
 *
 * @param props - The component's props.
 * @param props.jobs - Every job, of which those on their way get a line.
 * @returns The page's section element.
 */
export function SongsPage({ jobs }: SongsPageProps) {
  const { data: listings, error } = useSongs();
  const { mutate: setStatus } = useSetSongStatus();
  const { mutate: deleteSong } = useDeleteSong();
  const [filter, setFilter] = useListFilter();
  const [openSongs, setOpenSongs] = useState<string[]>([]);
  const now = useNow();
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
    isKept: listing.song.status === 'keeper',
  }));
  const shown = items
    .filter((item) => isShown(item, filter))
    .sort((first, second) => second.listing.song.created.localeCompare(first.listing.song.created));
  const groups = groupByTime(shown, ({ listing }) => listing.song.created, now);

  async function confirmDelete(song: Song): Promise<void> {
    const question = `Delete "${song.title}"? The clips no other song plays go with it.`;
    if (await askToConfirm({ question, answer: 'Delete', isDanger: true })) deleteSong(song.id);
  }

  return (
    <section className="list-page">
      <Breadcrumbs crumbs={[{ label: 'Songs' }]} />
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
      <ul className="list">
        {groups.flatMap(({ label, items: groupItems }) => [
          <li key={`group-${label}`} className="list-group">
            {label}
          </li>,
          ...groupItems.map(({ listing }) => {
            const { song, seconds } = listing;
            const isOpen = openSongs.includes(song.id);
            return (
              <li key={song.id}>
                <div className="list-row has-play has-expand">
                  {song.status === 'new' && (
                    <span
                      className="list-unheard"
                      data-tooltip="not played yet"
                      aria-label="not played yet"
                    />
                  )}
                  <PlayButton songId={song.id} isWaitingForAudio={listing.isWaitingForAudio} />
                  <span className="list-main">
                    <a
                      className="list-title list-link"
                      href={`/songs/${encodeURIComponent(song.id)}`}
                    >
                      {song.title}
                    </a>
                    <span className="list-tags">
                      {song.tags.map((tag) => tag.name).join(' · ')}
                    </span>
                  </span>
                  <span className="list-facts">
                    <span>{formatSeconds(seconds)}</span>
                    <span>{Math.round(song.bpm)} bpm</span>
                    <span>{formatMeter(song.beats)}</span>
                  </span>
                  <StatusButtons
                    status={song.status}
                    onChange={(status) => setStatus({ songId: song.id, status })}
                    onDelete={() => void confirmDelete(song)}
                    deleteLabel="delete this song"
                  />
                  <button
                    type="button"
                    className={`songs-page-expand${isOpen ? ' is-open' : ''}`}
                    onClick={() => toggleOpen(song.id)}
                    data-tooltip={isOpen ? 'less' : 'more: the prompt, prompt again, details'}
                    aria-label={isOpen ? 'less' : 'more: the prompt, prompt again, details'}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown />
                  </button>
                </div>
                {isOpen && <SongRowDetails listing={listing} titlesById={titlesById} />}
              </li>
            );
          }),
        ])}
      </ul>
    </section>
  );
}
