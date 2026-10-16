// The New page: a prompt for Claude, written in a box that takes the screen, and below it the cards
// of the jobs on their way and those of the last hour. A card can be hidden once its job is over.
import { useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { JobCard } from '../JobCard.tsx';
import { isJobRunning } from '../jobs-data.ts';
import { PromptBox } from '../PromptBox.tsx';

const HIDDEN_JOBS_KEY = 'chiptune.hiddenJobs';

type NewPageProps = { jobs: Job[]; onPromptSent: () => void };

/** The New page. */
export function NewPage({ jobs, onPromptSent }: NewPageProps) {
  const [hiddenJobs, setHiddenJobs] = useState<string[]>(readHiddenJobs);
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
      <PromptBox onSent={onPromptSent} />
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
