// The Jobs page: every prompt sent, as a card, newest first: the ones on their way, then the ones
// done or failed, each with a trash can to take it off the list, under a heading with their totals
// (songs, time, tokens) in the columns the cards show them in and a trash can to take them all off. Sending a
// prompt on New leads here.
import type { Job } from '../../shared/job.types.ts';
import { formatSeconds, formatTokens } from '../format.ts';
import { JobCard } from './JobCard.tsx';
import { getJobTotals } from './job-totals.ts';
import { isJobRunning, useRemoveJob, useRemoveJobs } from '../queries/jobs.ts';
import { usePageTitle } from '../use-page-title.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import './JobsPage.css';
import { askToConfirm } from '../stores/confirm-store.ts';
import { Trash2 } from 'lucide-react';

/** How large the trash can is drawn, in pixels. */
const TRASH_SIZE = 16;

type JobsPageProps = { jobs: Job[] };

/**
 * Shows the Jobs page: the jobs on their way, then those done or failed, each with a trash can.
 *
 * @param props - The component's props.
 * @param props.jobs - Every job, newest first.
 * @returns The page's section element.
 */
export function JobsPage({ jobs }: JobsPageProps) {
  usePageTitle('Jobs');
  const { mutate: removeJob } = useRemoveJob();
  const { mutate: removeJobs, isPending: isClearing } = useRemoveJobs();
  const running = jobs.filter(isJobRunning);
  const finished = jobs.filter((job) => !isJobRunning(job));
  const totals = getJobTotals(finished);
  return (
    <section className="jobs-page">
      <Breadcrumbs crumbs={[{ label: 'Jobs' }]} />
      {jobs.length === 0 && (
        <p className="empty">
          No jobs yet. <a href="/new">+ New song</a> sends a prompt to Claude; its job shows here.
        </p>
      )}
      {running.length > 0 && <h2 className="jobs-page-heading">On its way</h2>}
      {running.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      {finished.length > 0 && (
        <h2 className="jobs-page-heading jobs-page-totals">
          <span className="jobs-page-totals-label">Done</span>
          <span className="jobs-page-totals-time" data-tooltip="the time the jobs took, added up">
            {formatSeconds(totals.seconds)}
          </span>
          <span
            className="jobs-page-totals-tokens"
            data-tooltip="the tokens Claude wrote, added up"
          >
            {totals.tokens ? formatTokens(totals.tokens) : ''}
          </span>
          <span className="jobs-page-totals-songs" data-tooltip="the songs the jobs made, added up">
            {totals.songCount} {totals.songCount === 1 ? 'song' : 'songs'}
          </span>
          <button
            type="button"
            className="jobs-page-clear"
            onClick={async () => {
              const question = getClearQuestion(finished.length);
              if (await askToConfirm({ question, answer: 'Clear', isDanger: true })) {
                removeJobs(finished.map((job) => job.id));
              }
            }}
            disabled={isClearing}
            data-tooltip="remove every job that is over from the list (their songs stay)"
            aria-label="remove every job that is over from the list"
          >
            <Trash2 size={TRASH_SIZE} />
          </button>
        </h2>
      )}
      {finished.map((job) => (
        <JobCard key={job.id} job={job} onRemove={() => removeJob(job.id)} />
      ))}
    </section>
  );
}

/**
 * Returns what the trash can over the jobs asks before it removes the jobs that are over.
 *
 * @param count - How many jobs are over.
 * @returns The question.
 */
function getClearQuestion(count: number): string {
  return `Remove the ${count === 1 ? 'job' : `${count} jobs`} that ${count === 1 ? 'is' : 'are'} over from the list? Their songs stay.`;
}
