// The note grid (docs/adr/0037): one channel of the selected clip (or the selected block's), time across as in the
// timeline and pitch up (docs/adr/0041), in a box that scrolls both ways over the channel's range
// (docs/adr/0040), the bar numbers at the top and the pitch names at the left staying in view. A tap on an empty place puts a
// note there; a tap on a note selects it, and the buttons under the grid move it in pitch or time,
// make it longer or shorter, or take it out. Save as new take makes a take of the edits and puts it
// in the block; on a take, Update this take puts one in its place (docs/adr/0039).
import type { MouseEvent } from 'react';
import { getNoteName } from '../../fur/notes.ts';
import { getNoteEnd, isPitch } from './note-grid.ts';
import { useNoteGrid } from './use-note-grid.ts';
import { useNoteGridScroll } from './use-note-grid-scroll.ts';
import '../jobs/jobs.css';
import './NoteGrid.css';

/** The width of a row, in pixels. */
const ROW_WIDTH = 18;
/** The height of a pitch, in pixels: tall enough to tap. */
const PITCH_HEIGHT = 24;
/** The width of the pitch names' column, in pixels. */
const GUTTER = 36;
/** The height of the bar numbers' ruler, in pixels. */
const RULER_HEIGHT = 18;

type NoteGridProps = {
  clipId: string;
  songId: string;
  isTake: boolean;
  onMade: (clipId: string) => void;
  onUpdated: (takeId: string, newTakeId: string) => void;
};

/**
 * Shows the note grid of a clip.
 *
 * @param props - The component's props.
 * @param props.clipId - The clip whose notes are edited.
 * @param props.songId - The song it is edited in.
 * @param props.isTake - Whether the clip is a take, which can be updated instead of a new one made.
 * @param props.onMade - Called with the take's id once it is made.
 * @param props.onUpdated - Called with the take edited and the take that updates it.
 * @returns The note grid element.
 */
export function NoteGrid({ clipId, songId, isTake, onMade, onUpdated }: NoteGridProps) {
  const grid = useNoteGrid({ clipId, songId, onMade, onUpdated });
  const { notes, channel, rows, rowCount, selectedRow, pitchRange } = grid;
  const highestPitch = pitchRange.highest;
  const scrollRef = useNoteGridScroll({
    channel: channel?.channel ?? null,
    highestPitch,
    middlePitch: pitchRange.middle,
    pitchHeight: PITCH_HEIGHT,
    rulerHeight: RULER_HEIGHT,
  });
  if (grid.error && !notes) return <p className="error">{grid.error.message}</p>;
  if (!notes) return <p className="note-grid-loading">Reading the notes…</p>;
  if (!channel) return <p className="note-grid-loading">This clip plays no pitched notes.</p>;
  const pitchCount = highestPitch - pitchRange.lowest + 1;
  const pitches = Array.from({ length: pitchCount }, (_unused, i) => highestPitch - i);
  const bars = Math.ceil(rowCount / notes.rowsPerBar);
  function tap(event: MouseEvent<HTMLDivElement>): void {
    const box = event.currentTarget.getBoundingClientRect();
    const row = Math.floor((event.clientX - box.left) / ROW_WIDTH);
    const line = Math.floor((event.clientY - box.top) / PITCH_HEIGHT);
    if (row >= 0 && row < rowCount && line >= 0 && line < pitchCount) {
      grid.tapCell(row, highestPitch - line);
    }
  }
  return (
    <div className="note-grid">
      {notes.channels.length > 1 && (
        <div className="note-grid-head">
          <select
            value={grid.channelIndex}
            onChange={(event) => grid.chooseChannel(Number(event.target.value))}
            aria-label="the channel shown"
          >
            {notes.channels.map((each, i) => (
              <option key={each.channel} value={i}>
                {each.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="note-grid-scroll" ref={scrollRef}>
        <div className="note-grid-sheet" style={{ width: GUTTER + rowCount * ROW_WIDTH }}>
          <div className="note-grid-ruler" style={{ height: RULER_HEIGHT }}>
            <span className="note-grid-corner" style={{ width: GUTTER }} />
            <span className="note-grid-bars" style={{ width: rowCount * ROW_WIDTH }}>
              {Array.from({ length: bars }, (_unused, bar) => (
                <span key={bar} style={{ left: bar * notes.rowsPerBar * ROW_WIDTH }}>
                  {bar + 1}
                </span>
              ))}
            </span>
          </div>
          <div className="note-grid-body">
            <div className="note-grid-pitches" style={{ width: GUTTER }}>
              {pitches.map((pitch) => (
                <span
                  key={pitch}
                  className={isSharp(pitch) ? 'is-sharp' : ''}
                  style={{ height: PITCH_HEIGHT }}
                >
                  {getNoteName(pitch).replace('-', '')}
                </span>
              ))}
            </div>
            <div
              className="note-grid-cells"
              style={{
                width: rowCount * ROW_WIDTH,
                height: pitchCount * PITCH_HEIGHT,
                backgroundSize: `${ROW_WIDTH}px 100%, ${notes.rowsPerBeat * ROW_WIDTH}px 100%, ${notes.rowsPerBar * ROW_WIDTH}px 100%`,
              }}
              onClick={tap}
            >
              {pitches.map((pitch, line) =>
                isSharp(pitch) ? (
                  <span
                    key={pitch}
                    className="note-grid-sharp"
                    style={{ top: line * PITCH_HEIGHT, height: PITCH_HEIGHT }}
                    aria-hidden="true"
                  />
                ) : null,
              )}
              {rows.filter(isPitch).map((row) => {
                const end = getNoteEnd(rows, row.row, rowCount);
                return (
                  <span
                    key={row.row}
                    className={`note-grid-note${row.row === selectedRow ? ' is-selected' : ''}`}
                    style={{
                      left: row.row * ROW_WIDTH,
                      width: (end - row.row) * ROW_WIDTH - 1,
                      top: (highestPitch - (row.note ?? 0)) * PITCH_HEIGHT,
                      height: PITCH_HEIGHT,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="note-grid-edits" aria-label="the selected note">
        <button type="button" disabled={selectedRow === null} onClick={() => grid.movePitch(-12)}>
          −oct
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.movePitch(-1)}>
          −1
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.movePitch(1)}>
          +1
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.movePitch(12)}>
          +oct
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.moveTime(-1)}>
          ← earlier
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.moveTime(1)}>
          later →
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.changeLength(-1)}>
          shorter
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.changeLength(1)}>
          longer
        </button>
        <button type="button" disabled={selectedRow === null} onClick={grid.remove}>
          Delete
        </button>
      </div>
      <div className="note-grid-foot">
        <button type="button" disabled={!grid.canUndo} onClick={grid.undo}>
          Undo
        </button>
        <button type="button" disabled={!grid.canUndo} onClick={grid.startOver}>
          Start over
        </button>
        <button
          type="button"
          className="note-grid-save"
          disabled={!grid.canUndo || grid.isMaking}
          onClick={grid.saveAsNewTake}
          data-tooltip="make a take of these notes and put it in the clip's place"
        >
          {grid.isSaving ? 'Making…' : 'Save as new take'}
        </button>
        {isTake && (
          <button
            type="button"
            className="note-grid-update"
            disabled={!grid.canUndo || grid.isMaking}
            onClick={grid.updateTake}
            data-tooltip="put these notes in place of this take; the old one is deleted"
          >
            {grid.isUpdating ? 'Updating…' : 'Update this take'}
          </button>
        )}
      </div>
      {grid.error && <p className="error">{grid.error.message}</p>}
    </div>
  );
}

/**
 * Tells whether a pitch is a sharp, a black key.
 *
 * @param pitch - The note, C-0 being 60.
 * @returns Whether it is a sharp.
 */
function isSharp(pitch: number): boolean {
  return getNoteName(pitch).includes('#');
}
