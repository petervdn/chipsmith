/**
 * Pattern note values and their names: "D-3", "C#5", "OFF". C-0 is 60. On pulse and SCC channels
 * Furnace's A-3 is 440 Hz; the NES triangle sounds an octave below (CLAUDE.md, "Pitch naming").
 */

/** A note off. */
export const NOTE_OFF = 180;
/** A note release. */
export const NOTE_RELEASE = 181;
/** A macro release. */
export const MACRO_RELEASE = 182;

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
const NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

/**
 * Returns the pattern value of a note name. Throws if the name is not a note.
 *
 * @param name - The note's name: "D-3", "C#5", "OFF".
 * @returns The pattern value, C-0 being 60.
 */
export function getNoteValue(name: string): number {
  if (name === 'OFF') return NOTE_OFF;
  const match = /^([A-G])([-#])(-?\d+)$/.exec(name);
  const semitone = SEMITONES.get(match?.[1] ?? '');
  if (!match || semitone === undefined) throw new Error(`not a note: ${name}`);
  const sharp = match[2] === '#' ? 1 : 0;
  return 60 + Number(match[3]) * 12 + semitone + sharp;
}

/**
 * Returns the name of a pattern value, as the tracker shows it.
 *
 * @param value - The pattern value, C-0 being 60.
 * @returns The note's name ("D-3", "C#5"), or "OFF", "===" (note release) or "REL" (macro release).
 */
export function getNoteName(value: number): string {
  if (value === NOTE_OFF) return 'OFF';
  if (value === NOTE_RELEASE) return '===';
  if (value === MACRO_RELEASE) return 'REL';
  const name = NAMES[((value % 12) + 12) % 12] ?? '??';
  return `${name}${Math.floor(value / 12) - 5}`;
}
