// The Jobs page: every prompt sent, as a card, newest first: the ones on their way, then the ones
// done or failed, each with ✕ to take it off the list. Sending a prompt on New leads here.
import type { Job } from '../../shared/job.types.ts';
import { JobCard } from './JobCard.tsx';
import { isJobRunning, useRemoveJob } from '../queries/jobs.ts';
import { usePageTitle } from '../use-page-title.ts';
import './JobsPage.css';

type JobsPageProps = { jobs: Job[] };

/** The Jobs page. */
export function JobsPage({ jobs }: JobsPageProps) {
  usePageTitle('Jobs');
  const { mutate: removeJob } = useRemoveJob();
  const running = jobs.filter(isJobRunning);
  const finished = jobs.filter((job) => !isJobRunning(job));
  return (
    <section className="jobs-page">
      {jobs.length === 0 && (
        <p className="empty">
          No jobs yet. <a href="/new">+ New song</a> sends a prompt to Claude; its job shows here.
        </p>
      )}
      {running.length > 0 && <h2 className="new-heading">On its way</h2>}
      {running.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      {finished.length > 0 && <h2 className="new-heading">Done</h2>}
      {finished.map((job) => (
        <JobCard key={job.id} job={job} onRemove={() => removeJob(job.id)} />
      ))}
    </section>
  );
}
