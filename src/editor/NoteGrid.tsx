// The note grid (docs/adr/0037): one channel of the selected block's clip, time down the screen and
// pitch across, an octave and its top note at a time (‹ › for others). A tap on an empty place puts
// a note there; a tap on a note selects it, and the buttons under the grid move it in pitch or
// time, make it longer or shorter, or take it out. Try makes a take of the edits and puts it in the
// block. Notes outside the pitches shown are marked at the edge.
import type { MouseEvent } from 'react';
import { getNoteName } from '../../fur/notes.ts';
import { PITCHES_SHOWN, getNoteEnd, isPitch } from './note-grid.ts';
import { useNoteGrid } from './use-note-grid.ts';
import '../jobs/jobs.css';
import './NoteGrid.css';

/** The height of a row, in pixels. */
const ROW_HEIGHT = 20;
/** The width of the bar numbers' column, in pixels. */
const GUTTER = 32;

type NoteGridProps = { clipId: string; songId: string; onMade: (clipId: string) => void };

/**
 * Shows the note grid of a clip.
 *
 * @param props - The component's props.
 * @param props.clipId - The clip whose notes are edited.
 * @param props.songId - The song it is edited in.
 * @param props.onMade - Called with the take's id once Try has made it.
 * @returns The note grid element.
 */
export function NoteGrid({ clipId, songId, onMade }: NoteGridProps) {
  const grid = useNoteGrid({ clipId, songId, onMade });
  const { notes, channel, rows, rowCount, selectedRow, lowestPitch } = grid;
  if (grid.error && !notes) return <p className="error">{grid.error.message}</p>;
  if (!notes) return <p className="note-grid-loading">Reading the notes…</p>;
  if (!channel) return <p className="note-grid-loading">This clip plays no pitched notes.</p>;
  const pitches = Array.from({ length: PITCHES_SHOWN }, (_unused, i) => lowestPitch + i);
  const highestPitch = lowestPitch + PITCHES_SHOWN - 1;
  const bars = Math.ceil(rowCount / notes.rowsPerBar);
  function tap(event: MouseEvent<HTMLDivElement>): void {
    const box = event.currentTarget.getBoundingClientRect();
    const row = Math.floor((event.clientY - box.top) / ROW_HEIGHT);
    const column = Math.floor(((event.clientX - box.left) / box.width) * PITCHES_SHOWN);
    if (row >= 0 && row < rowCount && column >= 0 && column < PITCHES_SHOWN) {
      grid.tapCell(row, lowestPitch + column);
    }
  }
  return (
    <div className="note-grid">
      <div className="note-grid-head">
        {notes.channels.length > 1 && (
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
        )}
        <span className="note-grid-range">
          <button
            type="button"
            onClick={() => grid.shiftPitches(-1)}
            data-tooltip="show an octave lower"
            aria-label="show an octave lower"
          >
            ‹
          </button>
          {getNoteName(lowestPitch)} – {getNoteName(highestPitch)}
          <button
            type="button"
            onClick={() => grid.shiftPitches(1)}
            data-tooltip="show an octave higher"
            aria-label="show an octave higher"
          >
            ›
          </button>
        </span>
      </div>
      <div className="note-grid-scroll">
        <div className="note-grid-pitches" style={{ paddingLeft: GUTTER }}>
          {pitches.map((pitch) => (
            <span key={pitch} className={isSharp(pitch) ? 'is-sharp' : ''}>
              {getNoteName(pitch).replace('-', '')}
            </span>
          ))}
        </div>
        <div className="note-grid-body" style={{ height: rowCount * ROW_HEIGHT }}>
          <div className="note-grid-bars" style={{ width: GUTTER }}>
            {Array.from({ length: bars }, (_unused, bar) => (
              <span key={bar} style={{ top: bar * notes.rowsPerBar * ROW_HEIGHT }}>
                {bar + 1}
              </span>
            ))}
          </div>
          <div
            className="note-grid-cells"
            style={{
              left: GUTTER,
              backgroundSize: `100% ${ROW_HEIGHT}px, 100% ${notes.rowsPerBeat * ROW_HEIGHT}px, 100% ${notes.rowsPerBar * ROW_HEIGHT}px`,
            }}
            onClick={tap}
          >
            {pitches.map((pitch, column) =>
              isSharp(pitch) ? (
                <span
                  key={pitch}
                  className="note-grid-sharp"
                  style={getColumnStyle(column)}
                  aria-hidden="true"
                />
              ) : null,
            )}
            {rows.filter(isPitch).map((row) => {
              const note = row.note ?? 0;
              const end = getNoteEnd(rows, row.row, rowCount);
              const isSelected = row.row === selectedRow;
              if (note < lowestPitch || note > highestPitch) {
                return (
                  <span
                    key={row.row}
                    className={`note-grid-away ${note < lowestPitch ? 'is-below' : 'is-above'}${isSelected ? ' is-selected' : ''}`}
                    style={{ top: row.row * ROW_HEIGHT }}
                  >
                    {getNoteName(note)}
                  </span>
                );
              }
              return (
                <span
                  key={row.row}
                  className={`note-grid-note${isSelected ? ' is-selected' : ''}`}
                  style={{
                    ...getColumnStyle(note - lowestPitch),
                    top: row.row * ROW_HEIGHT,
                    height: (end - row.row) * ROW_HEIGHT - 1,
                  }}
                />
              );
            })}
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
          ↑ earlier
        </button>
        <button type="button" disabled={selectedRow === null} onClick={() => grid.moveTime(1)}>
          ↓ later
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
          className="note-grid-try"
          disabled={!grid.canUndo || grid.isMaking}
          onClick={grid.tryTake}
          data-tooltip="make a take of these notes and put it in the block"
        >
          {grid.isMaking ? 'Making…' : 'Try as a take'}
        </button>
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

/**
 * Returns where a column of the grid is, across.
 *
 * @param column - The column, from the lowest pitch shown.
 * @returns Its left and width, as shares of the grid.
 */
function getColumnStyle(column: number): { left: string; width: string } {
  return {
    left: `${(column / PITCHES_SHOWN) * 100}%`,
    width: `${100 / PITCHES_SHOWN}%`,
  };
}
