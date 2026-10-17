// A job's card on the Jobs page, from the moment its prompt is sent: its phase, how long it has been
// going, what it is doing now, the songs it makes as they come, and how it ended.
import { useEffect, useState } from 'react';
import type { Job, JobPhase, JobSong } from '../../shared/job.types.ts';
import { formatSeconds } from '../format.ts';
import { isJobRunning } from '../queries/jobs.ts';
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
 * it makes, how it ended, and its steps on demand.
 *
 * @param props - The component's props.
 * @param props.job - The job shown.
 * @param props.onRemove - Called when ✕ is pressed to remove the job, given only for a job that
 *   is over; without it there is no ✕.
 * @returns The card's section element.
 */
export function JobCard({ job, onRemove }: JobCardProps) {
  const [isShowingNotes, setShowingNotes] = useState(false);
  const isRunning = isJobRunning(job);
  const elapsed = useElapsed(job);
  const phaseName = getPhaseName(job);
  const now = getNowText(job);

  return (
    <section className={`job-card is-${job.phase}`}>
      <header className="job-card-head">
        {isRunning && <span className="jobs-spinner" aria-hidden="true" />}
        <span className="job-card-phase">{phaseName}</span>
        <span className="jobs-time">{formatSeconds(elapsed)}</span>
        {onRemove && (
          <button
            type="button"
            className="job-card-remove"
            onClick={onRemove}
            title="remove this job from the list (its songs stay)"
          >
            ✕
          </button>
        )}
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
          {job.notes.map((note, i) => (
            <li key={`${note.at}-${i}`}>
              <span className="job-card-note-time">
                {formatSeconds((Date.parse(note.at) - Date.parse(job.created)) / 1000)}
              </span>
              {note.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
