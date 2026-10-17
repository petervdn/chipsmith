// A job's card on the New page, from the moment its prompt is sent: its phase, how long it has been
// going, what it is doing now, the songs it makes as they come, and how it ended.
import { useEffect, useState } from 'react';
import type { Job, JobPhase, JobSong } from '../shared/job.types.ts';
import { formatSeconds } from './format.ts';
import { isJobRunning } from './queries/jobs.ts';

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

type JobCardProps = { job: Job; onHide: () => void };

/** Seconds a job has been going, or went, kept current every second while it runs. */
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

/** What a job is doing, in a few words: "Rendering 2 of 5". */
export function getPhaseName({ phase, songs }: Job): string {
  if (phase !== 'rendering') return PHASE_NAMES[phase];
  const doneCount = songs.filter((song) => song.state === 'done').length;
  return `Rendering ${Math.min(doneCount + 1, songs.length)} of ${songs.length}`;
}

/** The card of a job. */
export function JobCard({ job, onHide }: JobCardProps) {
  const [isShowingNotes, setShowingNotes] = useState(false);
  const isRunning = isJobRunning(job);
  const elapsed = useElapsed(job);
  const phaseName = getPhaseName(job);
  const lastNote = job.notes.at(-1)?.text ?? '';

  return (
    <section className={`job-card is-${job.phase}`}>
      <header className="job-head">
        {isRunning && <span className="job-spinner" aria-hidden="true" />}
        <span className="job-phase">{phaseName}</span>
        <span className="job-time">{formatSeconds(elapsed)}</span>
        {!isRunning && (
          <button type="button" className="job-hide" onClick={onHide} title="hide this card">
            ✕
          </button>
        )}
      </header>
      <p className="job-prompt">{job.prompt}</p>
      {isRunning && <p className="job-now">{lastNote}</p>}
      {job.songs.length > 0 && (
        <ul className="job-songs">
          {job.songs.map((song) => (
            <li key={song.title} className={`job-song is-${song.state}`}>
              <span className="job-song-mark">{SONG_MARKS[song.state]}</span>
              {song.songId ? (
                <a href={`/songs/${encodeURIComponent(song.songId)}`}>{song.title}</a>
              ) : (
                <span>{song.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {job.summary && !isRunning && <p className="job-summary">{job.summary}</p>}
      {job.error && <p className="error">{job.error}</p>}
      <button
        type="button"
        className="job-notes-toggle"
        onClick={() => setShowingNotes(!isShowingNotes)}
      >
        {isShowingNotes ? 'Hide steps' : `All steps (${job.notes.length})`}
      </button>
      {isShowingNotes && (
        <ol className="job-notes">
          {job.notes.map((note, i) => (
            <li key={`${note.at}-${i}`}>
              <span className="job-note-time">
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
