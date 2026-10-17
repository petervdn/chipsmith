// A job's steps: while it runs, its current step (labelled, with a spinner, its text shimmering),
// and on demand every step, each with its time, a bar of its share of the job's time, and the
// tokens Claude wrote in it before its text, a labelled line where a stage of the job starts; the
// last is the current step, Claude's live one while it is in the middle of something that is not a
// step yet.
import { Fragment, useState } from 'react';
import type { Job } from '../../shared/job.types.ts';
import { formatSeconds, formatTokenCount, formatTokens } from '../format.ts';
import { getStageName } from './job-stages.ts';
import { getStageStarts, getStepLengths, getStepText } from './job-steps.ts';
import './JobSteps.css';

type JobStepsProps = {
  job: Job;
  isRunning: boolean;
  elapsed: number;
  now: string;
};

/**
 * Shows a job's current step and, on demand, all its steps.
 *
 * @param props - The component's props.
 * @param props.job - The job.
 * @param props.isRunning - Whether it is still on its way.
 * @param props.elapsed - How long it has been going, or went, in seconds.
 * @param props.now - What it is doing now: Claude's live line, else its last step; empty before its
 *   first step, when no current step is shown.
 * @returns The steps' element.
 */
export function JobSteps({ job, isRunning, elapsed, now }: JobStepsProps) {
  const [isShowingAll, setShowingAll] = useState(false);
  const live = isRunning && job.now ? getStepText(job.now) : '';
  const lengths = getStepLengths(
    job.notes,
    job.created,
    job.finished ?? Date.parse(job.created) + elapsed * 1000,
  );
  const stageStarts = getStageStarts(job.notes);
  return (
    <div className="job-steps">
      <div className="job-steps-current">
        {isRunning && now && (
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
          {isShowingAll
            ? 'Hide the steps'
            : `Show all steps (${job.notes.length + (live ? 1 : 0)})`}
        </button>
      </div>
      {isShowingAll && (
        <ol className="job-steps-list">
          {job.notes.map((note, i) => {
            const length = lengths[i];
            const { tokens } = note;
            const isCurrent = isRunning && !live && i === job.notes.length - 1;
            const stageStart = stageStarts[i];
            return (
              <Fragment key={`${note.at}-${i}`}>
                {stageStart && <li className="job-steps-stage">{getStageName(stageStart)}</li>}
                <li className={isCurrent ? 'is-current' : ''}>
                  <span className="job-steps-time">
                    {formatSeconds((Date.parse(note.at) - Date.parse(job.created)) / 1000)}
                  </span>
                  <span
                    className="job-steps-length"
                    data-tooltip={
                      length
                        ? `${formatSeconds(length.seconds)}, ${Math.round(length.share * 100)}% of the job`
                        : ''
                    }
                  >
                    <span style={{ width: `${(length?.share ?? 0) * 100}%` }} />
                  </span>
                  <span
                    className="job-steps-tokens"
                    data-tooltip={
                      tokens ? `${formatTokens(tokens)} Claude wrote in this step (estimated)` : ''
                    }
                  >
                    {tokens ? formatTokenCount(tokens) : ''}
                  </span>
                  <span className="job-steps-text">
                    {isCurrent && <span className="jobs-spinner" aria-label="in progress" />}
                    <span className="job-steps-words">{getStepText(note.text)}</span>
                  </span>
                </li>
              </Fragment>
            );
          })}
          {live && (
            <li className="is-current">
              <span className="job-steps-time" />
              <span className="job-steps-length" />
              <span className="job-steps-tokens">
                {job.nowTokens ? formatTokenCount(job.nowTokens) : ''}
              </span>
              <span className="job-steps-text">
                <span className="jobs-spinner" aria-label="in progress" />
                <span className="job-steps-words">{live}</span>
              </span>
            </li>
          )}
        </ol>
      )}
    </div>
  );
}
