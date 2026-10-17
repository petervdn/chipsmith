/**
 * The keys a song can be in: the notes and the modes (scales), each mode its steps above the key's
 * note, and the chords that are its own, as numerals on the major scale (chord-numerals.ts):
 * stacked in thirds from each step, or, for a scale whose chords are not (the blues), listed.
 * Knows nothing of files or the page.
 */
import type { Numeral } from './chord-numerals.ts';
import { readNumeral, writeNumeral } from './chord-numerals.ts';

/** A mode: its name, its steps in semitones above the key's note, and its chords where listed. */
export type Mode = { name: string; steps: number[]; chords?: string[] };

/** The notes a key is on. */
export const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/** The modes and scales a key is in. */
export const MODES: Mode[] = [
  { name: 'major', steps: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'minor', steps: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'phrygian', steps: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'lydian', steps: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'phrygian dominant', steps: [0, 1, 4, 5, 7, 8, 10] },
  { name: 'blues', steps: [0, 3, 5, 6, 7, 10], chords: ['I7', 'IV7', 'V7'] },
];

/** The steps from a chord's root to its third, fifth and seventh in a seven-note scale. */
const THIRD = 2;
const FIFTH = 4;
const SEVENTH = 6;
/** The semitones in an octave, and in the intervals that tell chords apart. */
const OCTAVE = 12;
const MAJOR_THIRD = 4;
const DIMINISHED_FIFTH = 6;
const AUGMENTED_FIFTH = 8;
const MINOR_SEVENTH = 10;
const MAJOR_SEVENTH = 11;
/** What added to a chord leaves its third out, so that it fits a step by its root alone. */
const THIRDLESS_ADDITIONS: string[] = ['5', 'sus2', 'sus4'];

/**
 * Returns a mode by its name.
 *
 * @param name - The mode's name.
 * @returns The mode, or undefined for a name that is not one.
 */
export function getMode(name: string): Mode | undefined {
  return MODES.find((mode) => mode.name === name);
}

/**
 * Returns a mode's own chords: on each step, its triad or seventh chord; a listed mode's as listed.
 *
 * @param mode - The mode.
 * @param isSeventh - Whether the chords are seventh chords.
 * @returns The chords as numerals, from the first step up.
 */
export function getModeChords(mode: Mode, isSeventh: boolean): string[] {
  if (mode.chords) return mode.chords;
  return mode.steps.map((_step, i) => writeNumeral(getStepChord(mode.steps, i, isSeventh)));
}

/**
 * Returns whether a chord is one of a mode's own: a root on one of its steps, with the quality of
 * that step's triad; a power or suspended chord by its root alone, a seventh by its triad.
 *
 * @param text - The chord's numeral.
 * @param mode - The mode.
 * @returns True when it is the mode's own; false for one borrowed, or a numeral that does not read.
 */
export function isInMode(text: string, mode: Mode): boolean {
  const numeral = readNumeral(text);
  if (!numeral) return false;
  const ownChords = getModeChords(mode, false).flatMap((own) => readNumeral(own) ?? []);
  return ownChords.some((own) => {
    if (own.semitones !== numeral.semitones) return false;
    if (mode.chords || THIRDLESS_ADDITIONS.includes(numeral.addition)) return true;
    return getTriadQuality(own) === getTriadQuality(numeral);
  });
}

/**
 * Returns the chord stacked in thirds on a step of a seven-note scale.
 *
 * @param steps - The scale's steps, in semitones above its first.
 * @param i - The step, 0 for the first.
 * @param isSeventh - Whether to add the seventh.
 * @returns The chord's numeral, read.
 */
function getStepChord(steps: number[], i: number, isSeventh: boolean): Numeral {
  const root = steps[i] ?? 0;
  /**
   * Returns how far a step of the scale above the chord's root is from it.
   *
   * @param step - How many steps of the scale above the root (2 for the third).
   * @returns The semitones, 0 to 11.
   */
  function above(step: number): number {
    return ((steps[(i + step) % steps.length] ?? 0) - root + OCTAVE) % OCTAVE;
  }
  const third = above(THIRD);
  const fifth = above(FIFTH);
  const seventh = above(SEVENTH);
  const quality =
    fifth === DIMINISHED_FIFTH
      ? isSeventh && seventh === MINOR_SEVENTH
        ? 'half-diminished'
        : 'diminished'
      : fifth === AUGMENTED_FIFTH
        ? 'augmented'
        : third === MAJOR_THIRD
          ? 'major'
          : 'minor';
  const addition = !isSeventh ? '' : seventh === MAJOR_SEVENTH ? 'maj7' : '7';
  return { degree: i, semitones: root, quality, addition };
}

/**
 * Returns a chord's triad: what it is built as without its seventh.
 *
 * @param numeral - The chord's numeral, read.
 * @param numeral.quality - What it is built as.
 * @returns Its quality, half-diminished taken as diminished.
 */
function getTriadQuality({ quality }: Numeral): string {
  return quality === 'half-diminished' ? 'diminished' : quality;
}
