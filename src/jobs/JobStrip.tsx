// One line for a job on its way, above the songs list: its phase and its stages as dots, how long it
// has been going and what it does now; it leads to the job's card on the Jobs page.
import type { Job } from '../../shared/job.schema.ts';
import { formatSeconds } from '../format.ts';
import { getNowText, getPhaseName, useElapsed } from './JobCard.tsx';
import { JobStages } from './JobStages.tsx';
import './jobs.css';
import './JobStrip.css';

type JobStripProps = { job: Job };

/**
 * Shows the line of a running job, which leads to the Jobs page.
 *
 * @param props - The component's props.
 * @param props.job - The running job.
 * @returns The line's link element.
 */
export function JobStrip({ job }: JobStripProps) {
  const elapsed = useElapsed(job);
  return (
    <a className="job-strip" href="/jobs">
      <span className="jobs-spinner" aria-hidden="true" />
      <span className="job-strip-phase">{getPhaseName(job)}</span>
      <JobStages job={job} isSmall />
      <span className="job-strip-now">{getNowText(job)}</span>
      <span className="jobs-time">{formatSeconds(elapsed)}</span>
      <span className="job-strip-go" aria-hidden="true">
        ›
      </span>
    </a>
  );
}
