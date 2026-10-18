/**
 * A progression written short: `i ♭VI ♭III ♭VII` or `iv i ♭VI V:½ V7:½`. A chord is its numeral
 * (chord-numerals.ts) and, after a colon, its length in bars (1 when left out; ¼ ½ ¾, 1½, 2, 0.5);
 * chords are separated by spaces, commas or bar lines. Read into chords and written back. Knows
 * nothing of files or the page.
 */
import { normalizeNumeral } from './chord-numerals.ts';
import type { Chord } from './harmony.schema.ts';

/** The progression a notation reads as, or what is wrong with it. */
export type ReadProgression = { chords: Chord[]; error: null } | { chords: null; error: string };

/** The shortest a chord can be, in bars; every length is a whole number of these. */
export const SHORTEST_BARS = 0.25;
/** The longest a chord can be, in bars. */
const LONGEST_BARS = 16;
/** The most chords a progression can have. */
const MOST_CHORDS = 64;
/** The parts of a bar written as fractions. */
const FRACTIONS: { text: string; bars: number }[] = [
  { text: '¼', bars: 0.25 },
  { text: '½', bars: 0.5 },
  { text: '¾', bars: 0.75 },
];
/** A length: whole bars and a fraction (`1½`, `½`, `2`), or a decimal (`0.5`). */
const LENGTH = /^(?:(\d*)([¼½¾]?)|(\d*\.\d+))$/;

/**
 * Reads a progression written short.
 *
 * @param text - The notation.
 * @returns The chords, each numeral written the one way, or the first chord that does not read.
 */
export function readProgression(text: string): ReadProgression {
  const tokens = text
    .trim()
    .split(/[\s,|]+/)
    .filter(Boolean);
  if (tokens.length === 0) return { chords: null, error: 'no chords' };
  if (tokens.length > MOST_CHORDS) {
    return { chords: null, error: `more than ${MOST_CHORDS} chords` };
  }
  const chords: Chord[] = [];
  for (const token of tokens) {
    const [numeralText = '', lengthText] = token.split(':');
    const numeral = normalizeNumeral(numeralText);
    if (!numeral) {
      return { chords: null, error: `"${numeralText}" is not a chord (like i, ♭VI, V7, iiø7)` };
    }
    const bars = lengthText === undefined ? 1 : readBars(lengthText);
    if (bars === null) {
      return {
        chords: null,
        error: `"${token}": a length is ¼ to ${LONGEST_BARS} bars, in quarters (V:½, i:2)`,
      };
    }
    chords.push({ numeral, bars });
  }
  return { chords, error: null };
}

/**
 * Writes a progression short.
 *
 * @param chords - The chords.
 * @returns The notation, like `iv i ♭VI V:½ V7:½`.
 */
export function writeProgression(chords: Chord[]): string {
  return chords
    .map(({ numeral, bars }) => (bars === 1 ? numeral : `${numeral}:${writeBars(bars)}`))
    .join(' ');
}

/**
 * Writes a length in bars: whole bars and a fraction.
 *
 * @param bars - The length, in bars.
 * @returns The length, like `½`, `1½`, `2`.
 */
export function writeBars(bars: number): string {
  const whole = Math.floor(bars);
  const fraction = FRACTIONS.find((candidate) => candidate.bars === bars - whole);
  if (!fraction) return String(bars);
  return `${whole > 0 ? whole : ''}${fraction.text}`;
}

/**
 * Returns how long a progression is.
 *
 * @param chords - The chords.
 * @returns The bars they last, together.
 */
export function getProgressionBars(chords: Chord[]): number {
  return chords.reduce((sum, chord) => sum + chord.bars, 0);
}

/**
 * Returns whether a length is one a chord can have: a whole number of quarter bars, ¼ to 16.
 *
 * @param bars - The length, in bars.
 * @returns True when it can.
 */
export function isChordLength(bars: number): boolean {
  return bars >= SHORTEST_BARS && bars <= LONGEST_BARS && Number.isInteger(bars / SHORTEST_BARS);
}

/**
 * Reads a chord's length.
 *
 * @param text - The length, like `½`, `1½`, `2`, `0.5`.
 * @returns The length in bars, or null when it is not one a chord can have.
 */
function readBars(text: string): number | null {
  const match = LENGTH.exec(text.trim());
  if (!match || text.trim() === '') return null;
  const [, whole = '', fraction = '', decimal] = match;
  const bars =
    decimal === undefined
      ? Number(whole || 0) + (FRACTIONS.find((candidate) => candidate.text === fraction)?.bars ?? 0)
      : Number(decimal);
  return isChordLength(bars) ? bars : null;
}
