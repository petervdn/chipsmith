// A job's card on the Jobs page, from the moment its prompt is sent: its phase, how long it has been
// going, what it is doing now, the songs it makes as they come, and how it ended.
import { useEffect, useState } from 'react';
import type { Job, JobPhase, JobSong } from '../../shared/job.types.ts';
import { formatSeconds } from '../format.ts';
import { isJobRunning } from '../queries/jobs.ts';
import { getStepLengths } from './job-steps.ts';
import './jobs.css';
import './JobCard.css';

const PHASE_NAMES = {
  queued: 'Waiting for the job before it',
  composing: 'Claude is composing',
  building: 'Building the songs',
  rendering: 'Rendering',
  done: 'Done',
  failed: 'Failed',
} satisfies Record<JobPhase, string>;

const SONG_MARKS = {
  waiting: '·',
  rendering: '⟳',
  done: '✓',
  failed: '✗',
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
 * Shows the card of a job: its phase, how long it has been going, what it is doing now, the songs
 * it makes, how it ended, and its steps on demand. A job that is over shows as one line, its prompt,
 * opened on a tap.
 *
 * @param props - The component's props.
 * @param props.job - The job shown.
 * @param props.onRemove - Called when ✕ is pressed to remove the job, given only for a job that
 *   is over; without it there is no ✕.
 * @returns The card's section element.
 */
export function JobCard({ job, onRemove }: JobCardProps) {
  const isRunning = isJobRunning(job);
  const [isShowingNotes, setShowingNotes] = useState(false);
  const [isOpen, setOpen] = useState(isRunning);
  const elapsed = useElapsed(job);
  const phaseName = getPhaseName(job);
  const now = getNowText(job);
  const lengths = getStepLengths(
    job.notes,
    job.created,
    job.finished ?? Date.parse(job.created) + elapsed * 1000,
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
          <span className="job-card-outcome">
            {job.phase === 'failed'
              ? 'failed'
              : `${madeCount} ${madeCount === 1 ? 'song' : 'songs'}`}
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
          <span className="job-card-phase">{phaseName}</span>
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
            <span className="job-card-phase">{phaseName}</span>
          </button>
        )}
        <span className="jobs-time">{formatSeconds(elapsed)}</span>
        {removeButton}
      </header>
      <p className="job-card-prompt">{job.prompt}</p>
      {job.guides.length > 0 && (
        <p className="job-card-guides">with {job.guides.map((guide) => guide.name).join(', ')}</p>
      )}
      {isRunning && <p className="job-card-now">{now}</p>}
      {job.songs.length > 0 && (
        <ul className="job-card-songs">
          {job.songs.map((song) => (
            <li key={song.title} className={`job-card-song is-${song.state}`}>
              <span className="job-card-song-mark">{SONG_MARKS[song.state]}</span>
              {song.songId ? (
                <a href={`/songs/${encodeURIComponent(song.songId)}`}>{song.title}</a>
              ) : (
                <span>{song.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {job.summary && !isRunning && <p className="job-card-summary">{job.summary}</p>}
      {job.error && <p className="error">{job.error}</p>}
      <button
        type="button"
        className="job-card-notes-toggle"
        onClick={() => setShowingNotes(!isShowingNotes)}
      >
        {isShowingNotes ? 'Hide steps' : `All steps (${job.notes.length})`}
      </button>
      {isShowingNotes && (
        <ol className="job-card-notes">
          {job.notes.map((note, i) => {
            const length = lengths[i];
            const isCurrent = isRunning && i === job.notes.length - 1;
            return (
              <li key={`${note.at}-${i}`} className={isCurrent ? 'is-current' : ''}>
                <span className="job-card-note-time">
                  {formatSeconds((Date.parse(note.at) - Date.parse(job.created)) / 1000)}
                </span>
                <span
                  className="job-card-note-length"
                  title={
                    length
                      ? `${formatSeconds(length.seconds)}, ${Math.round(length.share * 100)}% of the job`
                      : ''
                  }
                >
                  <span style={{ width: `${(length?.share ?? 0) * 100}%` }} />
                </span>
                <span className="job-card-note-text">
                  {isCurrent && <span className="jobs-spinner" aria-label="in progress" />}
                  <span className="job-card-note-words">{note.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
