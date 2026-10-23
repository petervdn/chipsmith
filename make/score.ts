/**
 * A kit for a job's script to write its parts with (the furnace-song skill): empty rows for a song,
 * notes named in true pitch and moved for their channel, effects, and bars written as strings of
 * notes or of drum hits. What every script wrote for itself before. Knows nothing of jobs or files.
 */
import type { Effect, Row } from '../fur/fur.types.ts';
import { NOTE_OFF } from '../fur/notes.ts';

/** A channel's rows for the whole song, `null` where a row is empty. */
export type Rows = (Row | null)[];

/**
 * Semitones a part written in true pitch is moved by on each kind of channel: Furnace's A-3 is
 * 440 Hz on a pulse or SCC channel, so those go down an octave; the NES triangle, the PSG and the
 * SID sound at their names.
 */
export const PITCH_SHIFT = { pulse: -12, scc: -12, triangle: 0, psg: 0, sid: 0, noise: 0 };

/** Semitones above C of each note letter. */
const SEMITONES = new Map([
  ['C', 0],
  ['D', 2],
  ['E', 4],
  ['F', 5],
  ['G', 7],
  ['A', 9],
  ['B', 11],
]);
/** The pattern value of C-0. */
const C_ZERO = 60;
const SEMITONES_PER_OCTAVE = 12;
/** A slot held: the note before it sounds on. */
const HOLD = '-';
/** A slot of rest: a sounding note is stopped. */
const REST = '.';

/**
 * Returns empty rows for a whole song.
 *
 * @param size - The song's size.
 * @param size.bars - How many bars it has.
 * @param size.rowsPerBar - The rows to a bar (16 for 4/4 in 16ths).
 * @returns One `null` per row.
 */
export function getEmptyRows({ bars, rowsPerBar }: { bars: number; rowsPerBar: number }): Rows {
  return Array.from({ length: bars * rowsPerBar }, () => null);
}

/**
 * Returns the pattern value of a note named in true pitch, moved for its channel. Throws if the
 * name is not a note.
 *
 * @param name - The note: a letter, `#` or `b` if it has one, and the octave ("D4", "C#3", "Bb2").
 * @param shift - Semitones to move it by: `PITCH_SHIFT.pulse` for a pulse, and so on.
 * @returns The pattern value.
 */
export function getNote(name: string, shift = 0): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  const semitone = SEMITONES.get(match?.[1] ?? '');
  if (!match || semitone === undefined) throw new Error(`not a note: "${name}"`);
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return C_ZERO + Number(match[3]) * SEMITONES_PER_OCTAVE + semitone + accidental + shift;
}

/**
 * Returns an effect for a row.
 *
 * @param code - The effect's code, such as `0x03` for portamento.
 * @param value - Its value.
 * @returns The effect.
 */
export function getEffect(code: number, value: number): Effect {
  return { code, value };
}

/**
 * Returns how many rows each slot of a bar string takes. Throws when the bar's rows do not divide.
 *
 * @param slotCount - The slots in the bar.
 * @param rowsPerBar - The rows to a bar.
 * @param bar - The bar's string, for the error.
 * @returns The rows to a slot.
 */
function getRowsPerSlot(slotCount: number, rowsPerBar: number, bar: string): number {
  if (slotCount === 0 || rowsPerBar % slotCount !== 0) {
    throw new Error(`${slotCount} slots do not divide ${rowsPerBar} rows: "${bar}"`);
  }
  return rowsPerBar / slotCount;
}

/** Where and how a part's bars are written. */
export type BarsWriting = {
  /** The bar the first string is written at, counted from 0. */
  bar: number;
  rowsPerBar: number;
  /**
   * One string per bar, its slots parted by spaces and each as long as the others: a note in true
   * pitch plays ("D4", "Bb3", "F#4:10" with a volume of 10), `-` holds the note before, `.` rests.
   */
  bars: string[];
  instrument: number;
  /** The volume of every note without its own; left out, the volume column stays empty. */
  volume?: number;
  /** Semitones to move every note by (`PITCH_SHIFT`). */
  shift?: number;
  /** Effects put on every note played. */
  effects?: Effect[];
};

/**
 * Writes a part's bars into a channel's rows: each note on its slot's first row, a note off where
 * a rest follows a note.
 *
 * @param rows - The channel's rows, written into.
 * @param writing - Where and how.
 * @param writing.bar - The bar the first string is written at, counted from 0.
 * @param writing.rowsPerBar - The rows to a bar.
 * @param writing.bars - One string per bar.
 * @param writing.instrument - The instrument that plays the notes.
 * @param writing.volume - The volume of every note without its own.
 * @param writing.shift - Semitones to move every note by.
 * @param writing.effects - Effects put on every note played.
 */
export function writeBars(
  rows: Rows,
  { bar, rowsPerBar, bars, instrument, volume, shift = 0, effects }: BarsWriting,
): void {
  let isSounding = false;
  bars.forEach((text, i) => {
    const slots = text.trim().split(/\s+/);
    const rowsPerSlot = getRowsPerSlot(slots.length, rowsPerBar, text);
    slots.forEach((slot, j) => {
      const at = (bar + i) * rowsPerBar + j * rowsPerSlot;
      if (slot === HOLD) return;
      if (slot === REST) {
        if (isSounding) rows[at] = { note: NOTE_OFF };
        isSounding = false;
        return;
      }
      const [name = '', ownVolume] = slot.split(':');
      const noteVolume = ownVolume === undefined ? volume : Number(ownVolume);
      rows[at] = {
        note: getNote(name, shift),
        instrument,
        ...(noteVolume === undefined ? {} : { volume: noteVolume }),
        ...(effects ? { effects } : {}),
      };
      isSounding = true;
    });
  });
}

/** Where drum hits are written, and what each letter plays. */
export type HitsWriting = {
  /** The bar the first pattern is written at, counted from 0. */
  bar: number;
  rowsPerBar: number;
  /**
   * One pattern per bar, a letter per slot ("k.h.s.h.k.h.s.h."; spaces are ignored): a letter in
   * `hits` plays its row, `.` nothing.
   */
  patterns: string[];
  /** The row each letter plays (`{ note, instrument, volume }`), by its letter. */
  hits: Map<string, Row>;
};

/**
 * Writes drum patterns into a channel's rows: a letter's row on its slot's first row.
 *
 * @param rows - The channel's rows, written into.
 * @param writing - Where and what.
 * @param writing.bar - The bar the first pattern is written at, counted from 0.
 * @param writing.rowsPerBar - The rows to a bar.
 * @param writing.patterns - One pattern per bar, a letter per slot.
 * @param writing.hits - The row each letter plays.
 */
export function writeHits(rows: Rows, { bar, rowsPerBar, patterns, hits }: HitsWriting): void {
  patterns.forEach((pattern, i) => {
    const slots = [...pattern.replace(/\s/g, '')];
    const rowsPerSlot = getRowsPerSlot(slots.length, rowsPerBar, pattern);
    slots.forEach((letter, j) => {
      if (letter === REST) return;
      const hit = hits.get(letter);
      if (!hit) throw new Error(`no hit for "${letter}" in "${pattern}"`);
      rows[(bar + i) * rowsPerBar + j * rowsPerSlot] = hit;
    });
  });
}
