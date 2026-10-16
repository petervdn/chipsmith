// The New page: a prompt for Claude, written in a box that takes the screen, and below it the cards
// of the jobs on their way and those of the last hour. A card can be hidden once its job is over.
// `/new?from=<song>` starts with that song's prompt, to send it again.
import { useState } from 'react';
import type { SongListing } from '../../shared/api.types.ts';
import type { Job } from '../../shared/job.types.ts';
import { JobCard } from '../JobCard.tsx';
import { isJobRunning } from '../jobs-data.ts';
import type { PromptSource } from '../PromptBox.tsx';
import { PromptBox } from '../PromptBox.tsx';
import { useServerData } from '../server-api.ts';

const HIDDEN_JOBS_KEY = 'chiptune.hiddenJobs';

type NewPageProps = { jobs: Job[]; onPromptSent: () => void };

/** The New page. */
export function NewPage({ jobs, onPromptSent }: NewPageProps) {
  const [hiddenJobs, setHiddenJobs] = useState<string[]>(readHiddenJobs);
  const [fromSongId] = useState(() => new URLSearchParams(window.location.search).get('from'));
  const [isSourceCleared, setSourceCleared] = useState(false);
  const { data: listings } = useServerData<SongListing[]>('/api/songs');
  const from = fromSongId ? listings?.find(({ song }) => song.id === fromSongId) : undefined;
  const source: PromptSource | null =
    from && !isSourceCleared
      ? {
          songId: from.song.id,
          title: from.song.title,
          isChangedAfterPrompt: from.isChangedAfterPrompt,
        }
      : null;

  function clearSource(): void {
    setSourceCleared(true);
    window.history.replaceState(null, '', '/new');
  }
  const shown = jobs.filter((job) => !hiddenJobs.includes(job.id));
  const running = shown.filter(isJobRunning);
  const finished = shown.filter((job) => !isJobRunning(job));

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
    <section className="new-page">
      {fromSongId && !listings ? (
        <p className="empty">Loading the prompt…</p>
      ) : (
        <PromptBox
          key={fromSongId ?? 'new'}
          initialText={from?.song.prompt ?? ''}
          source={source}
          onClearSource={clearSource}
          onSent={onPromptSent}
        />
      )}
      {running.length > 0 && <h2 className="new-heading">On its way</h2>}
      {running.map((job) => (
        <JobCard key={job.id} job={job} onHide={() => hideJob(job.id)} />
      ))}
      {finished.length > 0 && <h2 className="new-heading">Last hour</h2>}
      {finished.map((job) => (
        <JobCard key={job.id} job={job} onHide={() => hideJob(job.id)} />
      ))}
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
