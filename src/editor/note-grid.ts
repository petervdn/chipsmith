/**
 * The note grid's edits of one channel's rows (docs/adr/0037): a note put in, moved in pitch or time,
 * made longer or shorter, taken out; how long a note sounds; and the pitches the grid shows. A
 * channel plays one note at a time, so a row holds at most one. Each edit takes the rows and gives
 * new ones, or the same when it cannot be done. Knows nothing of the page.
 */
import type { ChannelRow } from '../../shared/clip-notes.schema.ts';
import { NOTE_OFF } from '../../fur/notes.ts';

/** How many pitches the grid shows across: an octave and its top note. */
export const PITCHES_SHOWN = 13;
/** Semitones to an octave. */
export const OCTAVE = 12;
/** The lowest pitch shown for a channel without notes: C-2. */
const EMPTY_LOWEST_PITCH = 84;
/** The highest note a row can hold that is a pitch; above it are note offs and releases. */
const HIGHEST_NOTE = NOTE_OFF - 1;

/**
 * Tells whether a row holds a pitched note, not a note off or a release.
 *
 * @param row - The row.
 * @param row.note - Its note, or null.
 * @returns Whether it holds a pitch.
 */
export function isPitch({ note }: ChannelRow): boolean {
  return note !== null && note < NOTE_OFF;
}

/**
 * Returns the row a note stops at: the next row with a note (a pitch, an off or a release), or the
 * end of the channel.
 *
 * @param rows - The channel's rows.
 * @param row - The row the note is on.
 * @param rowCount - How many rows the channel has.
 * @returns The row it stops at, after its last sounding row.
 */
export function getNoteEnd(rows: ChannelRow[], row: number, rowCount: number): number {
  return rows
    .filter((other) => other.row > row && other.note !== null)
    .reduce((first, other) => Math.min(first, other.row), rowCount);
}

/**
 * Puts a note on a row, in place of any note there; it plays with the instrument of the note
 * before it, or the channel's first.
 *
 * @param rows - The channel's rows.
 * @param row - The row.
 * @param note - The note.
 * @returns The rows with the note.
 */
export function putNote(rows: ChannelRow[], row: number, note: number): ChannelRow[] {
  const old = rows.find((other) => other.row === row);
  const instrument = old?.instrument ?? getInstrumentBefore(rows, row);
  const put = { row, note, instrument, volume: old?.volume ?? null };
  return sortRows([...rows.filter((other) => other.row !== row), put]);
}

/**
 * Moves a note up or down in pitch.
 *
 * @param rows - The channel's rows.
 * @param row - The row the note is on.
 * @param semitones - How far, up or down.
 * @returns The rows with the note moved; the same when there is no pitch there or it would go past
 *   the notes Furnace plays.
 */
export function moveNotePitch(rows: ChannelRow[], row: number, semitones: number): ChannelRow[] {
  const old = rows.find((other) => other.row === row);
  if (!old || !isPitch(old) || old.note === null) return rows;
  const note = old.note + semitones;
  if (note < 0 || note > HIGHEST_NOTE) return rows;
  return rows.map((other) => (other === old ? { ...old, note } : other));
}

/**
 * Moves a note a number of rows earlier or later, with the note off that ends it if one does; it
 * keeps its instrument and volume.
 *
 * @param rows - The channel's rows.
 * @param row - The row the note is on.
 * @param by - How many rows, earlier (below 0) or later.
 * @param rowCount - How many rows the channel has.
 * @returns The rows with the note moved, and where it is now; the same when a note is in the way or
 *   it would leave the channel.
 */
export function moveNoteTime(
  rows: ChannelRow[],
  row: number,
  by: number,
  rowCount: number,
): { rows: ChannelRow[]; row: number } {
  const old = rows.find((other) => other.row === row);
  if (!old || !isPitch(old)) return { rows, row };
  const end = getNoteEnd(rows, row, rowCount);
  const ending = rows.find((other) => other.row === end && other.note !== null && !isPitch(other));
  const moving = ending ? [old, ending] : [old];
  const targets = moving.map((moved) => moved.row + by);
  if (targets.some((target) => target < 0 || target >= rowCount)) return { rows, row };
  const others = rows.filter((other) => !moving.includes(other));
  if (others.some((other) => other.note !== null && targets.includes(other.row))) {
    return { rows, row };
  }
  const [from, to] = [Math.min(row, row + by), Math.max(row, row + by)];
  if (others.some((other) => other.note !== null && other.row > from && other.row < to)) {
    return { rows, row };
  }
  const moved = moving.map((each) => {
    const target = each.row + by;
    const there = others.find((other) => other.row === target);
    return { ...each, row: target, volume: each.volume ?? there?.volume ?? null };
  });
  const left = others.filter((other) => !targets.includes(other.row));
  return { rows: sortRows([...left, ...moved]), row: row + by };
}

/**
 * Makes a note a row longer or shorter, by moving the note off that ends it, or putting one in.
 *
 * @param rows - The channel's rows.
 * @param row - The row the note is on.
 * @param by - 1 longer, -1 shorter.
 * @param rowCount - How many rows the channel has.
 * @returns The rows with the note's length changed; the same when it is a row long and asked to be
 *   shorter, or the next note is in the way.
 */
export function changeNoteLength(
  rows: ChannelRow[],
  row: number,
  by: number,
  rowCount: number,
): ChannelRow[] {
  const old = rows.find((other) => other.row === row);
  if (!old || !isPitch(old)) return rows;
  const end = getNoteEnd(rows, row, rowCount);
  const newEnd = end + by;
  if (newEnd <= row) return rows;
  const ending = rows.find((other) => other.row === end && other.note !== null && !isPitch(other));
  if (ending) {
    if (newEnd >= rowCount) return rows.filter((other) => other !== ending);
    if (rows.some((other) => other.row === newEnd && other.note !== null)) return rows;
    return sortRows([
      ...rows.filter((other) => other !== ending && other.row !== newEnd),
      {
        ...ending,
        row: newEnd,
        volume: rows.find((other) => other.row === newEnd)?.volume ?? null,
      },
    ]);
  }
  if (by > 0) return rows;
  const there = rows.find((other) => other.row === newEnd);
  return sortRows([
    ...rows.filter((other) => other.row !== newEnd),
    { row: newEnd, note: NOTE_OFF, instrument: null, volume: there?.volume ?? null },
  ]);
}

/**
 * Takes a note out of its row; a volume on the row stays.
 *
 * @param rows - The channel's rows.
 * @param row - The row.
 * @returns The rows without the note.
 */
export function removeNote(rows: ChannelRow[], row: number): ChannelRow[] {
  return rows.flatMap((other) => {
    if (other.row !== row) return [other];
    return other.volume === null ? [] : [{ ...other, note: null, instrument: null }];
  });
}

/**
 * Returns the lowest pitch the grid shows at first: for notes that fit in what it shows, the C at or
 * below the lowest when they fit from there, else the pitch that puts the highest at the top; for
 * notes spread wider, the C that puts the middle of them nearest its middle.
 *
 * @param rows - The channel's rows.
 * @returns The lowest note shown.
 */
export function getFirstLowestPitch(rows: ChannelRow[]): number {
  const notes = rows.flatMap((row) => (isPitch(row) && row.note !== null ? [row.note] : []));
  if (notes.length === 0) return EMPTY_LOWEST_PITCH;
  const lowest = Math.min(...notes);
  const highest = Math.max(...notes);
  if (highest - lowest < PITCHES_SHOWN) {
    const fromC = Math.floor(lowest / OCTAVE) * OCTAVE;
    return fromC + PITCHES_SHOWN - 1 >= highest ? fromC : highest - (PITCHES_SHOWN - 1);
  }
  return Math.round(((lowest + highest) / 2 - OCTAVE / 2) / OCTAVE) * OCTAVE;
}

function getInstrumentBefore(rows: ChannelRow[], row: number): number | null {
  const before = rows.filter((other) => other.row < row && other.instrument !== null);
  return (
    before.at(-1)?.instrument ?? rows.find((other) => other.instrument !== null)?.instrument ?? null
  );
}

function sortRows(rows: ChannelRow[]): ChannelRow[] {
  return [...rows].sort((first, second) => first.row - second.row);
}
