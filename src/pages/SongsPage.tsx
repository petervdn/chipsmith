// The songs list, the start page: every song with its length, tempo, meter, tags and status, the
// filter bar above it, and ★ / ✕ on each row. A row opens the song.
import { useEffect, useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { JobCard } from '../JobCard.tsx';
import { PromptBox } from '../PromptBox.tsx';
import type { Status } from '../../shared/catalogue.types.ts';
import type { SongListing } from '../../shared/api.types.ts';
import type { Song } from '../../shared/song.types.ts';
import { FilterBar } from '../FilterBar.tsx';
import { PlayButton } from '../PlayButton.tsx';
import { formatMeter, formatSeconds } from '../format.ts';
import type { ListFilter } from '../list-filter.ts';
import { EMPTY_FILTER, getTagCounts, isShown } from '../list-filter.ts';
import { sendChange, useServerData } from '../server-api.ts';
import { StatusButtons } from '../StatusButtons.tsx';
import { UndoBar, useUndo } from '../UndoBar.tsx';

const HIDDEN_JOBS_KEY = 'chiptune.hiddenJobs';

type SongsPageProps = { jobs: Job[]; onPromptSent: () => void };

/** The songs list, with the prompt box and the jobs on their way above it. */
export function SongsPage({ jobs, onPromptSent }: SongsPageProps) {
  const { data: listings, error, reload } = useServerData<SongListing[]>('/api/songs');
  const [hiddenJobs, setHiddenJobs] = useState<string[]>(readHiddenJobs);
  const madeCount = jobs.flatMap((job) => job.songs).filter((song) => song.songId).length;
  useEffect(() => reload(), [madeCount, reload]);
  const [filter, setFilter] = useState<ListFilter>(EMPTY_FILTER);
  const [undoOffer, setUndoOffer] = useUndo();
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

  function hideJob(jobId: string): void {
    const next = [...hiddenJobs, jobId];
    setHiddenJobs(next);
    try {
      localStorage.setItem(HIDDEN_JOBS_KEY, JSON.stringify(next));
    } catch {
      /* hidden until the page reloads */
    }
  }

  return (
    <section className="list-page">
      <PromptBox onSent={onPromptSent} />
      {jobs
        .filter((job) => !hiddenJobs.includes(job.id))
        .map((job) => (
          <JobCard key={job.id} job={job} onHide={() => hideJob(job.id)} />
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
                onChange={(status) => void setStatus(song, status)}
              />
            </div>
          </li>
        ))}
      </ul>
      <UndoBar offer={undoOffer} onClose={() => setUndoOffer(null)} />
    </section>
  );
}

/** The jobs whose cards were hidden, as this browser remembers them. */
function readHiddenJobs(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HIDDEN_JOBS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
