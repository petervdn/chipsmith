// The New page: a prompt for Claude, written in a box that takes the screen, and below it the cards
// of the jobs on their way and those of the last hour. A card can be hidden once its job is over.
// `/new?from=<song>` starts with that song's prompt, to send it again; `/new?base=<song>` starts with
// "Based on <song> [<id>]: ", for a prompt that changes that song (notes/making-songs.md).
import { useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { JobCard } from '../JobCard.tsx';
import type { PromptSource } from '../PromptBox.tsx';
import { PromptBox } from '../PromptBox.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import { useSongs } from '../queries/songs.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { usePageTitle } from '../use-page-title.ts';

type NewPageProps = { jobs: Job[] };

/** The New page. */
export function NewPage({ jobs }: NewPageProps) {
  const hiddenJobs = usePreferencesStore((preferences) => preferences.hiddenJobIds);
  const hideJob = usePreferencesStore((preferences) => preferences.hideJob);
  const [fromSongId] = useState(() => new URLSearchParams(window.location.search).get('from'));
  const [baseSongId] = useState(() => new URLSearchParams(window.location.search).get('base'));
  const [isSourceCleared, setSourceCleared] = useState(false);
  usePageTitle('New song');
  const { data: listings } = useSongs();
  const from = fromSongId ? listings?.find(({ song }) => song.id === fromSongId) : undefined;
  const base = baseSongId ? listings?.find(({ song }) => song.id === baseSongId) : undefined;
  const initialText = from
    ? from.song.prompt
    : base
      ? `Based on ${base.song.title} [${base.song.id}]: `
      : '';
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

  return (
    <section className="new-page">
      {(fromSongId || baseSongId) && !listings ? (
        <p className="empty">Loading the prompt…</p>
      ) : (
        <PromptBox
          key={fromSongId ?? baseSongId ?? 'new'}
          initialText={initialText}
          source={source}
          onClearSource={clearSource}
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
