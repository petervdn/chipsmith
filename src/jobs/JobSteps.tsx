// A job's steps: while it runs, its current step (labelled, with a spinner, its text shimmering),
// and on demand every step, each with its time, a bar of its share of the job's time, and the
// tokens Claude wrote in it before its text.
import { useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { formatSeconds, formatTokenCount, formatTokens } from '../format.ts';
import { getStepLengths, getStepTokens } from './job-steps.ts';
import './JobSteps.css';

type JobStepsProps = {
  job: Job;
  isRunning: boolean;
  elapsed: number;
  now: string;
  totalTokens: number;
};

/**
 * Shows a job's current step and, on demand, all its steps.
 *
 * @param props - The component's props.
 * @param props.job - The job.
 * @param props.isRunning - Whether it is still on its way.
 * @param props.elapsed - How long it has been going, or went, in seconds.
 * @param props.now - What it is doing now: Claude's live line, else its last step.
 * @param props.totalTokens - The tokens Claude wrote so far, what it is in the middle of included.
 * @returns The steps' element.
 */
export function JobSteps({ job, isRunning, elapsed, now, totalTokens }: JobStepsProps) {
  const [isShowingAll, setShowingAll] = useState(false);
  const lengths = getStepLengths(
    job.notes,
    job.created,
    job.finished ?? Date.parse(job.created) + elapsed * 1000,
  );
  const stepTokens = getStepTokens(job.notes, totalTokens);
  return (
    <div className="job-steps">
      <div className="job-steps-current">
        {isRunning && (
          <>
            <span className="job-steps-label">Current step</span>
            <span className="jobs-spinner" aria-hidden="true" />
            <span className="job-steps-now">{now}</span>
          </>
        )}
        <button
          type="button"
          className="job-steps-toggle"
          onClick={() => setShowingAll(!isShowingAll)}
          aria-expanded={isShowingAll}
        >
          {isShowingAll ? 'Hide the steps' : `Show all steps (${job.notes.length})`}
        </button>
      </div>
      {isShowingAll && (
        <ol className="job-steps-list">
          {job.notes.map((note, i) => {
            const length = lengths[i];
            const tokens = stepTokens[i] ?? null;
            const isCurrent = isRunning && i === job.notes.length - 1;
            return (
              <li key={`${note.at}-${i}`} className={isCurrent ? 'is-current' : ''}>
                <span className="job-steps-time">
                  {formatSeconds((Date.parse(note.at) - Date.parse(job.created)) / 1000)}
                </span>
                <span
                  className="job-steps-length"
                  title={
                    length
                      ? `${formatSeconds(length.seconds)}, ${Math.round(length.share * 100)}% of the job`
                      : ''
                  }
                >
                  <span style={{ width: `${(length?.share ?? 0) * 100}%` }} />
                </span>
                <span
                  className="job-steps-tokens"
                  title={tokens === null ? '' : `${formatTokens(tokens)} Claude wrote in this step`}
                >
                  {tokens === null ? '' : formatTokenCount(tokens)}
                </span>
                <span className="job-steps-text">
                  {isCurrent && <span className="jobs-spinner" aria-label="in progress" />}
                  <span className="job-steps-words">{note.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
