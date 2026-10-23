// A job's card on the Jobs page, from the moment its prompt is sent: in its top row its phase, how
// long it has been going and the tokens it used; under it its stages from start to end; then,
// labelled, the prompt, the model that composed it, the clip it makes takes of, the songs or takes it makes (a line for each asked for, its title once built), the
// style guides, structure and harmony sent with it, Claude's reply, and its steps. A job that is
// over folds to one line.
import { useEffect, useState } from 'react';
import type { Job, JobPhase } from '../../shared/job.schema.ts';
import { formatSeconds, formatTokens } from '../format.ts';
import { COMPOSER_EFFORT_NAMES } from '../../shared/composer-efforts.ts';
import { COMPOSER_MODEL_FACTS } from '../../shared/composer-models.ts';
import { getHarmonySummary } from '../../shared/harmony-prompt.ts';
import { writeNotation } from '../../shared/structure-notation.ts';
import { isJobRunning, useCancelJob } from '../queries/jobs.ts';
import { JobStages } from './JobStages.tsx';
import { JobSteps } from './JobSteps.tsx';
import './jobs.css';
import './JobCard.css';
import { askToConfirm } from '../stores/confirm-store.ts';
import { getStepText } from './job-steps.ts';
import { getJobSongRows, getSongCountText } from './job-songs.ts';
import type { JobSongRow } from './job-songs.ts';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

/** How large the trash can is drawn, in pixels. */
const TRASH_SIZE = 16;

const PHASE_NAMES = {
  queued: 'Waiting for the job before it',
  composing: 'Claude is composing',
  building: 'Building the songs',
  rendering: 'Rendering',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
} satisfies Record<JobPhase, string>;

/** What Cancel asks before it stops a job. */
const CANCEL_QUESTION =
  'Cancel this job? Claude stops; a song being rendered is finished, the rest are not made. Songs made already stay.';

/** What a song of the job is doing, said beside its title. */
const SONG_STATES = {
  waiting: 'waiting',
  rendering: 'rendering…',
  done: '',
  failed: 'failed',
  unwritten: 'to be written',
  unmade: 'not made',
} satisfies Record<JobSongRow['state'], string>;

/** The card, and what to do when its job is removed (a job that is over), if it can be. */
type JobCardProps = { job: Job; onRemove?: () => void };

/**
 * Keeps how long a job has been going, or went, current every second while it runs.
 *
 * @param job - The job.
 * @returns The seconds from the job's start to now, or to its end when it is over.
 */
export function useElapsed(job: Job): number {
  const [now, setNow] = useState(() => Date.now());
  const isRunning = isJobRunning(job);
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);
  const end = job.finished ? Date.parse(job.finished) : now;
  return Math.max(0, (end - Date.parse(job.created)) / 1000);
}

/**
 * Returns what a job is doing in a few words, such as "Claude is composing · 3 songs" or
 * "Rendering 2 of 5".
 *
 * @param job - The job.
 * @returns The phase's name, with how many songs it makes while it runs, and which song of how many
 *   while it renders.
 */
export function getPhaseName(job: Job): string {
  const { phase, songs } = job;
  const isRunning = isJobRunning(job);
  const countText = isRunning ? getSongCountText(job, isRunning) : null;
  if (phase !== 'rendering') {
    return countText ? `${PHASE_NAMES[phase]} · ${countText}` : PHASE_NAMES[phase];
  }
  const doneCount = songs.filter((song) => song.state === 'done').length;
  return `Rendering ${Math.min(doneCount + 1, songs.length)} of ${songs.length}`;
}

/**
 * Returns what a running job is doing now.
 *
 * @param job - The job.
 * @param job.now - What Claude is in the middle of, if anything.
 * @param job.notes - The job's notes, of which the last is used otherwise.
 * @returns What Claude is in the middle of, else the last note, capitalized, no full stop; else an empty string.
 */
export function getNowText({ now, notes }: Job): string {
  return getStepText(now ?? notes.at(-1)?.text ?? '');
}

/**
 * Shows the card of a job.
 *
 * @param props - The component's props.
 * @param props.job - The job shown.
 * @param props.onRemove - Called when the trash can is pressed to remove the job, given only for a
 *   job that is over; without it there is no trash can.
 * @returns The card's section element.
 */
export function JobCard({ job, onRemove }: JobCardProps) {
  const isRunning = isJobRunning(job);
  const [isOpen, setOpen] = useState(isRunning);
  const { mutate: cancelJob } = useCancelJob();
  const totalTokens = (job.tokens ?? 0) + (isRunning ? (job.nowTokens ?? 0) : 0);
  const elapsed = useElapsed(job);
  const tokens = (
    <span
      className="job-card-tokens"
      data-tooltip="the tokens Claude wrote, thinking included; while it runs, what it is in the middle of counts too"
    >
      {totalTokens ? formatTokens(totalTokens) : ''}
    </span>
  );
  const removeButton = onRemove && (
    <button
      type="button"
      className="job-card-remove"
      onClick={onRemove}
      data-tooltip="remove this job from the list (its songs stay)"
      aria-label="remove this job from the list"
    >
      <Trash2 size={TRASH_SIZE} />
    </button>
  );
  const songCountText = getSongCountText(job, isRunning);
  if (!isRunning && !isOpen) {
    return (
      <section className={`job-card is-${job.phase} is-closed`}>
        <header className="job-card-head">
          <button
            type="button"
            className="job-card-toggle"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            data-tooltip="show the job"
          >
            <span className="job-card-mark" aria-hidden="true">
              <ChevronRight />
            </span>
            <span className="job-card-title">{job.prompt.split('\n')[0]}</span>
          </button>
          <span className="jobs-time">{formatSeconds(elapsed)}</span>
          {tokens}
          <span className="job-card-outcome">
            {job.phase === 'done' ? (songCountText ?? 'no songs') : job.phase}
          </span>
          {removeButton}
        </header>
      </section>
    );
  }

  return (
    <section className={`job-card is-${job.phase}`}>
      <header className="job-card-head">
        {isRunning && <span className="jobs-spinner" aria-hidden="true" />}
        {isRunning ? (
          <span className="job-card-phase">{getPhaseName(job)}</span>
        ) : (
          <button
            type="button"
            className="job-card-toggle"
            onClick={() => setOpen(false)}
            aria-expanded={true}
            data-tooltip="fold the job to one line"
          >
            <span className="job-card-mark" aria-hidden="true">
              <ChevronDown />
            </span>
            <span className="job-card-phase">{getPhaseName(job)}</span>
          </button>
        )}
        <span className="jobs-time">{formatSeconds(elapsed)}</span>
        {tokens}
        {isRunning && (
          <button
            type="button"
            className="job-card-cancel"
            onClick={async () => {
              const question = CANCEL_QUESTION;
              if (await askToConfirm({ question, answer: 'Stop the job', isDanger: true })) {
                cancelJob(job.id);
              }
            }}
            data-tooltip="stop this job"
          >
            Cancel
          </button>
        )}
        {removeButton}
      </header>
      <JobStages job={job} />
      <dl className="job-card-facts">
        <dt>Prompt</dt>
        <dd className="job-card-prompt">{job.prompt}</dd>
        {job.model && (
          <>
            <dt>Composed by</dt>
            <dd>
              {COMPOSER_MODEL_FACTS[job.model].name}
              {job.effort && `, effort ${COMPOSER_EFFORT_NAMES[job.effort].toLowerCase()}`}
            </dd>
          </>
        )}
        {job.takesOf && (
          <>
            <dt>Takes of</dt>
            <dd>
              <a href={`/songs/${encodeURIComponent(job.takesOf.song)}`}>
                {job.takesOf.clip} in {job.takesOf.song}
              </a>
            </dd>
          </>
        )}
        {songCountText && (
          <>
            <dt>{songCountText}</dt>
            <dd>
              <ul className="job-card-songs">
                {getJobSongRows(job, isRunning).map((song, i) => (
                  <li key={i} className={`job-card-song is-${song.state}`}>
                    {song.state === 'rendering' && (
                      <span className="jobs-spinner" aria-hidden="true" />
                    )}
                    {song.songId ? (
                      <a href={`/songs/${encodeURIComponent(song.songId)}`}>{song.title}</a>
                    ) : (
                      <span>{song.title}</span>
                    )}
                    {SONG_STATES[song.state] && (
                      <span className="job-card-song-state">{SONG_STATES[song.state]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
        {job.guides.length > 0 && (
          <>
            <dt>Style guides</dt>
            <dd>
              {job.guides.map((guide, i) => (
                <span key={guide.id}>
                  {i > 0 && ', '}
                  <a
                    href="/guides"
                    data-tooltip="the style guides (what was sent is kept with the songs)"
                  >
                    {guide.name}
                  </a>
                </span>
              ))}
            </dd>
          </>
        )}
        {job.structure && (
          <>
            <dt>Structure</dt>
            <dd>
              {job.structure.name}{' '}
              <span className="job-card-notation">{writeNotation(job.structure.sections)}</span>
            </dd>
          </>
        )}
        {job.harmony && (
          <>
            <dt>Harmony</dt>
            <dd className="job-card-notation">{getHarmonySummary(job.harmony)}</dd>
          </>
        )}
        {job.summary && !isRunning && (
          <>
            <dt>Claude's reply</dt>
            <dd className="job-card-summary">{job.summary}</dd>
          </>
        )}
      </dl>
      {job.error && <p className="error">{job.error}</p>}
      <JobSteps job={job} isRunning={isRunning} elapsed={elapsed} now={getNowText(job)} />
    </section>
  );
}
