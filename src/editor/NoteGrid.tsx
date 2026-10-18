// The note grid (docs/adr/0037): one channel of the selected block's clip, time down the screen and
// pitch across, in a box that scrolls both ways over the channel's range (docs/adr/0040), the pitch
// names at the top and the bar numbers at the left staying in view. A tap on an empty place puts a
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

/** The height of a row, in pixels. */
const ROW_HEIGHT = 20;
/** The width of the bar numbers' column, in pixels. */
const GUTTER = 32;
/** The width of a pitch's column, in pixels: wide enough to tap. */
const COLUMN_WIDTH = 28;

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
  const lowestPitch = pitchRange.lowest;
  const scrollRef = useNoteGridScroll({
    channel: channel?.channel ?? null,
    lowestPitch,
    middlePitch: pitchRange.middle,
    columnWidth: COLUMN_WIDTH,
    gutter: GUTTER,
  });
  if (grid.error && !notes) return <p className="error">{grid.error.message}</p>;
  if (!notes) return <p className="note-grid-loading">Reading the notes…</p>;
  if (!channel) return <p className="note-grid-loading">This clip plays no pitched notes.</p>;
  const pitchCount = pitchRange.highest - lowestPitch + 1;
  const pitches = Array.from({ length: pitchCount }, (_unused, i) => lowestPitch + i);
  const bars = Math.ceil(rowCount / notes.rowsPerBar);
  function tap(event: MouseEvent<HTMLDivElement>): void {
    const box = event.currentTarget.getBoundingClientRect();
    const row = Math.floor((event.clientY - box.top) / ROW_HEIGHT);
    const column = Math.floor((event.clientX - box.left) / COLUMN_WIDTH);
    if (row >= 0 && row < rowCount && column >= 0 && column < pitchCount) {
      grid.tapCell(row, lowestPitch + column);
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
        <div className="note-grid-sheet" style={{ width: GUTTER + pitchCount * COLUMN_WIDTH }}>
          <div className="note-grid-pitches">
            <span className="note-grid-corner" style={{ width: GUTTER }} />
            {pitches.map((pitch) => (
              <span
                key={pitch}
                className={isSharp(pitch) ? 'is-sharp' : ''}
                style={{ width: COLUMN_WIDTH }}
              >
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
                width: pitchCount * COLUMN_WIDTH,
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
                const end = getNoteEnd(rows, row.row, rowCount);
                return (
                  <span
                    key={row.row}
                    className={`note-grid-note${row.row === selectedRow ? ' is-selected' : ''}`}
                    style={{
                      ...getColumnStyle((row.note ?? 0) - lowestPitch),
                      top: row.row * ROW_HEIGHT,
                      height: (end - row.row) * ROW_HEIGHT - 1,
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
          className="note-grid-save"
          disabled={!grid.canUndo || grid.isMaking}
          onClick={grid.saveAsNewTake}
          data-tooltip="make a take of these notes and put it in the block"
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

/**
 * Returns where a column of the grid is, across.
 *
 * @param column - The column, from the lowest pitch laid out.
 * @returns Its left and width, in pixels.
 */
function getColumnStyle(column: number): { left: number; width: number } {
  return { left: column * COLUMN_WIDTH, width: COLUMN_WIDTH };
}
