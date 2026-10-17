// One line for a job on its way, above the songs list: its phase, how long it has been going and
// what it does now; it leads to the job's card on the Jobs page.
import type { Job } from '../shared/job.types.ts';
import { formatSeconds } from './format.ts';
import { getNowText, getPhaseName, useElapsed } from './JobCard.tsx';

type JobStripProps = { job: Job };

/** The line of a running job. */
export function JobStrip({ job }: JobStripProps) {
  const elapsed = useElapsed(job);
  return (
    <a className="job-strip" href="/jobs">
      <span className="job-spinner" aria-hidden="true" />
      <span className="job-strip-phase">{getPhaseName(job)}</span>
      <span className="job-strip-now">{getNowText(job)}</span>
      <span className="job-time">{formatSeconds(elapsed)}</span>
      <span className="job-strip-go" aria-hidden="true">
        ›
      </span>
    </a>
  );
}
