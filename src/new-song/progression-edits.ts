/**
 * The edits of a part's progression in the Harmony panel: a chord changed (its numeral or length),
 * copied after itself, moved, or removed (never the last). Each takes the chords and gives new
 * ones. Knows nothing of the page.
 */
import type { Chord } from '../../shared/harmony.types.ts';

/** The lengths offered for a chord, in bars. */
export const CHORD_LENGTHS = [0.25, 0.5, 1, 2, 4];

/**
 * Changes a chord.
 *
 * @param chords - The chords.
 * @param index - The chord to change.
 * @param change - Its numeral, its length, or both.
 * @returns The chords, that one changed.
 */
export function changeChord(chords: Chord[], index: number, change: Partial<Chord>): Chord[] {
  return chords.map((chord, i) => (i === index ? { ...chord, ...change } : chord));
}

/**
 * Places a copy of a chord right after it.
 *
 * @param chords - The chords.
 * @param index - The chord to copy.
 * @returns The chords with the copy after it.
 */
export function duplicateChord(chords: Chord[], index: number): Chord[] {
  const chord = chords[index];
  if (!chord) return chords;
  return [...chords.slice(0, index + 1), { ...chord }, ...chords.slice(index + 1)];
}

/**
 * Moves a chord a place earlier or later, staying among the chords.
 *
 * @param chords - The chords.
 * @param index - The chord to move.
 * @param step - -1 for earlier, 1 for later.
 * @returns The chords, that one moved; as they were when it cannot move that way.
 */
export function moveChord(chords: Chord[], index: number, step: number): Chord[] {
  const target = index + step;
  const chord = chords[index];
  const other = chords[target];
  if (!chord || !other) return chords;
  return chords.map((current, i) => (i === index ? other : i === target ? chord : current));
}

/**
 * Removes a chord, never the last one.
 *
 * @param chords - The chords.
 * @param index - The chord to remove.
 * @returns The chords without it; as they were when it is the only one.
 */
export function removeChord(chords: Chord[], index: number): Chord[] {
  if (chords.length <= 1) return chords;
  return chords.filter((_chord, i) => i !== index);
}
