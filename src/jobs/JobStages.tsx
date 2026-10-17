// A job's way from start to end: its stages in a row (preparing, writing, checking, building,
// rendering, done), each done, current, still to come, or where it failed or was stopped. Small, as
// dots only, in the line of a running job.
import { Check, X } from 'lucide-react';
import type { Job } from '../../shared/job.types.ts';
import type { StageState } from './job-stages.ts';
import { getJobStages } from './job-stages.ts';
import './JobStages.css';

type JobStagesProps = { job: Job; isSmall?: boolean };

/** What each state of a stage is called, for its tooltip. */
const STATE_WORDS = {
  done: 'done',
  current: 'now',
  todo: 'to come',
  failed: 'failed here',
  stopped: 'stopped here',
} satisfies Record<StageState, string>;

/**
 * Shows a job's stages.
 *
 * @param props - The component's props.
 * @param props.job - The job.
 * @param props.isSmall - Whether to show dots only, without the stages' names.
 * @returns The stages' list element.
 */
export function JobStages({ job, isSmall = false }: JobStagesProps) {
  const stages = getJobStages(job);
  return (
    <ol className={`job-stages${isSmall ? ' is-small' : ''}`} aria-label="stages">
      {stages.map((stage) => (
        <li
          key={stage.name}
          className={`job-stages-stage is-${stage.state}`}
          data-tooltip={`${stage.name}: ${STATE_WORDS[stage.state]}`}
        >
          <span className="job-stages-dot" aria-hidden="true">
            {stage.state === 'done' && <Check />}
            {(stage.state === 'failed' || stage.state === 'stopped') && <X />}
          </span>
          {!isSmall && <span className="job-stages-name">{stage.name}</span>}
        </li>
      ))}
    </ol>
  );
}
