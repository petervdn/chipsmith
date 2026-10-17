// A job's card on the Jobs page, from the moment its prompt is sent: in its top row its phase, how
// long it has been going and the tokens it used; then, labelled, the prompt, the style guides and
// structure sent with it, the songs it makes as they come, Claude's reply, and its steps. A job that
// is over folds to one line.
import { useEffect, useState } from 'react';
import type { Job, JobPhase, JobSong } from '../../shared/job.types.ts';
import { formatSeconds, formatTokens } from '../format.ts';
import { writeNotation } from '../../shared/structure-notation.ts';
import { isJobRunning, useCancelJob } from '../queries/jobs.ts';
import { JobSteps } from './JobSteps.tsx';
import './jobs.css';
import './JobCard.css';

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
} satisfies Record<JobSong['state'], string>;

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
 * Returns what a job is doing in a few words, such as "Rendering 2 of 5".
 *
 * @param job - The job.
 * @param job.phase - The phase the job is in.
 * @param job.songs - The songs it makes, counted while it renders.
 * @returns The phase's name, with which song of how many while it renders.
 */
export function getPhaseName({ phase, songs }: Job): string {
  if (phase !== 'rendering') return PHASE_NAMES[phase];
  const doneCount = songs.filter((song) => song.state === 'done').length;
  return `Rendering ${Math.min(doneCount + 1, songs.length)} of ${songs.length}`;
}

/**
 * Returns what a running job is doing now.
 *
 * @param job - The job.
 * @param job.now - What Claude is in the middle of, if anything.
 * @param job.notes - The job's notes, of which the last is used otherwise.
 * @returns What Claude is in the middle of, else the last note, else an empty string.
 */
export function getNowText({ now, notes }: Job): string {
  return now ?? notes.at(-1)?.text ?? '';
}

/**
 * Shows the card of a job.
 *
 * @param props - The component's props.
 * @param props.job - The job shown.
 * @param props.onRemove - Called when ✕ is pressed to remove the job, given only for a job that
 *   is over; without it there is no ✕.
 * @returns The card's section element.
 */
export function JobCard({ job, onRemove }: JobCardProps) {
  const isRunning = isJobRunning(job);
  const [isOpen, setOpen] = useState(isRunning);
  const { mutate: cancelJob } = useCancelJob();
  const elapsed = useElapsed(job);
  const tokens = (
    <span className="job-card-tokens" title="the tokens Claude wrote, thinking included">
      {job.tokens ? formatTokens(job.tokens) : ''}
    </span>
  );
  const removeButton = onRemove && (
    <button
      type="button"
      className="job-card-remove"
      onClick={onRemove}
      title="remove this job from the list (its songs stay)"
    >
      ✕
    </button>
  );
  if (!isRunning && !isOpen) {
    const madeCount = job.songs.filter((song) => song.songId).length;
    return (
      <section className={`job-card is-${job.phase} is-closed`}>
        <header className="job-card-head">
          <button
            type="button"
            className="job-card-toggle"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            title="show the job"
          >
            <span className="job-card-mark" aria-hidden="true">
              ▸
            </span>
            <span className="job-card-title">{job.prompt.split('\n')[0]}</span>
          </button>
          <span className="jobs-time">{formatSeconds(elapsed)}</span>
          {tokens}
          <span className="job-card-outcome">
            {job.phase === 'done'
              ? `${madeCount} ${madeCount === 1 ? 'song' : 'songs'}`
              : job.phase}
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
            title="fold the job to one line"
          >
            <span className="job-card-mark" aria-hidden="true">
              ▾
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
            onClick={() => {
              if (window.confirm(CANCEL_QUESTION)) cancelJob(job.id);
            }}
            title="stop this job"
          >
            Cancel
          </button>
        )}
        {removeButton}
      </header>
      <dl className="job-card-facts">
        <dt>Prompt</dt>
        <dd className="job-card-prompt">{job.prompt}</dd>
        {job.guides.length > 0 && (
          <>
            <dt>Style guides</dt>
            <dd>
              {job.guides.map((guide, i) => (
                <span key={guide.id}>
                  {i > 0 && ', '}
                  <a href="/guides" title="the style guides (what was sent is kept with the songs)">
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
        {job.songs.length > 0 && (
          <>
            <dt>Songs</dt>
            <dd>
              <ul className="job-card-songs">
                {job.songs.map((song) => (
                  <li key={song.title} className={`job-card-song is-${song.state}`}>
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
