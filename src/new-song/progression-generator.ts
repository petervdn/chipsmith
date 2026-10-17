/**
 * A progression made up at random for a part: chords of the mode (and borrowed or chromatic ones,
 * as the colour allows) walked from the tonic by what each does (tonic, pre-dominant, dominant),
 * laid out at the harmonic rhythm asked for, ending on the cadence asked for, as triads, seventh
 * chords or power chords. Knows nothing of the page.
 */
import type { Numeral } from '../../shared/chord-numerals.ts';
import { readNumeral, writeNumeral } from '../../shared/chord-numerals.ts';
import type { Chord, HarmonySettings } from '../../shared/harmony.types.ts';
import type { HarmonyValue } from '../../shared/harmony-settings.ts';
import type { Mode } from '../../shared/modes.ts';
import { getModeChords, isInMode } from '../../shared/modes.ts';

/** What a chord does in a progression. */
type ChordRole = 'tonic' | 'tonic-like' | 'pre-dominant' | 'dominant';

/** A chord the walk can pick: its numeral, as a triad, and what it does. */
type Candidate = { numeral: string; role: ChordRole };

/** What each step of a seven-note mode does, from the first. */
const STEP_ROLES: ChordRole[] = [
  'tonic',
  'pre-dominant',
  'tonic-like',
  'pre-dominant',
  'dominant',
  'tonic-like',
  'dominant',
];
/** What each role a blues's listed chords have, in order (I7, IV7, V7). */
const LISTED_ROLES: ChordRole[] = ['tonic', 'pre-dominant', 'dominant'];
/** What can follow a chord, by what it does. */
const NEXT_ROLES = {
  tonic: ['tonic-like', 'pre-dominant', 'dominant'],
  'tonic-like': ['pre-dominant', 'dominant', 'tonic-like'],
  'pre-dominant': ['dominant', 'pre-dominant', 'tonic'],
  dominant: ['tonic', 'tonic-like'],
} satisfies Record<ChordRole, ChordRole[]>;
/** Chords borrowed from the parallel major, for a mode with a minor third. */
const FROM_MAJOR: Candidate[] = [
  { numeral: 'IV', role: 'pre-dominant' },
  { numeral: 'V', role: 'dominant' },
];
/** Chords borrowed from the parallel minor, for a mode with a major third. */
const FROM_MINOR: Candidate[] = [
  { numeral: 'iv', role: 'pre-dominant' },
  { numeral: '♭VI', role: 'pre-dominant' },
  { numeral: '♭VII', role: 'dominant' },
  { numeral: '♭III', role: 'tonic-like' },
];
/** Chromatic chords: the Neapolitan, the dominant of the dominant, chromatic mediants. */
const CHROMATIC: Candidate[] = [
  { numeral: '♭II', role: 'pre-dominant' },
  { numeral: 'II', role: 'pre-dominant' },
  { numeral: 'III', role: 'tonic-like' },
  { numeral: 'VI', role: 'tonic-like' },
  { numeral: '♭VI', role: 'pre-dominant' },
  { numeral: '♭III', role: 'tonic-like' },
];
/** The semitones above the key's note of a minor third, the dominant and the subdominant. */
const MINOR_THIRD = 3;
const DOMINANT = 7;
const SUBDOMINANT = 5;
/** The roots, above the key's note, of the major chords that usually take a dominant seventh. */
const DOMINANT_SEVENTH_ROOTS = [2, 4, 7, 9, 10];
/** How many bars a progression goes round in, and in when its chords last 2 bars. */
const CYCLE_BARS = 4;
const LONG_CYCLE_BARS = 8;
/** How often a varying harmonic rhythm holds a chord for 2 bars, or splits a bar in two. */
const HOLD_CHANCE = 0.2;
const SPLIT_CHANCE = 0.25;
/** How often a progression with no cadence asked for ends on the dominant. */
const DOMINANT_ENDING_CHANCE = 0.5;
/** How often a pick may land on a diminished chord. */
const DIMINISHED_CHANCE = 0.15;
/** How many times the walk tries for a chord that differs from the one before it. */
const TRIES = 8;

/** What a progression is made up from. */
export type GeneratorInput = {
  mode: Mode;
  settings: HarmonySettings;
  /** How many bars it goes round in. */
  bars: number;
};

/**
 * Makes up a progression.
 *
 * @param input - What it is made from.
 * @param input.mode - The mode its chords come from.
 * @param input.settings - The harmony's settings: its chords, colour, harmonic rhythm and cadence.
 * @param input.bars - How many bars it lasts.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The chords, lasting the bars asked for.
 */
export function generateProgression(
  { mode, settings, bars }: GeneratorInput,
  getRandom: () => number,
): Chord[] {
  const candidates = getCandidates(mode, settings.colour);
  const lengths = getLengths(bars, settings.rhythm, getRandom);
  const cadence = getCadence(settings.cadence, candidates, getRandom);
  const tonic = candidates[0]?.numeral ?? 'I';
  const walked = lengths.length - cadence.length;
  const numerals =
    walked <= 0
      ? cadence.slice(-lengths.length)
      : [...walk(tonic, candidates, walked, getRandom), ...cadence];
  return numerals.map((numeral, i) => ({
    numeral: setChordKind(numeral, settings.chords, mode),
    bars: lengths[i] ?? 1,
  }));
}

/**
 * Returns how many bars a part's progression goes round in: 4 (8 when chords last 2 bars), or the
 * part's own bars where it is short or they do not divide by it.
 *
 * @param partBars - The bars of the part, or null for a whole song.
 * @param rhythm - How often the chords change, or null for Claude's choice.
 * @returns The bars.
 */
export function getCycleBars(
  partBars: number | null,
  rhythm: HarmonyValue<'rhythm'> | null,
): number {
  const cycle = rhythm === 'two-bars' ? LONG_CYCLE_BARS : CYCLE_BARS;
  if (partBars === null || partBars % cycle === 0) return cycle;
  return partBars <= cycle * 2 ? partBars : cycle;
}

/**
 * Sets the kind of a chord: as it is, its seventh chord, or its power chord.
 *
 * @param numeral - The chord's numeral, a triad or as listed.
 * @param kind - The kind of chords, or null for as it is.
 * @param mode - The mode, whose own sevenths a chord of its own takes.
 * @returns The chord's numeral.
 */
export function setChordKind(
  numeral: string,
  kind: HarmonyValue<'chords'> | null,
  mode: Mode,
): string {
  const read = readNumeral(numeral);
  if (!read || kind === null) return numeral;
  if (kind === 'power') return writeNumeral({ ...read, quality: 'major', addition: '5' });
  if (kind === 'triads') return writeNumeral({ ...read, addition: '' });
  if (read.addition !== '') return numeral;
  const own = getModeChords(mode, true).find((chord) => {
    const ownRead = readNumeral(chord);
    return ownRead?.semitones === read.semitones && isInMode(numeral, mode);
  });
  if (own) return own;
  if (read.quality === 'diminished') return writeNumeral({ ...read, quality: 'half-diminished' });
  const isDominant = read.quality === 'major' && DOMINANT_SEVENTH_ROOTS.includes(read.semitones);
  const addition = read.quality === 'major' && !isDominant ? 'maj7' : '7';
  return writeNumeral({ ...read, addition });
}

/**
 * Returns the chords the walk can pick: the mode's own, and those its colour borrows.
 *
 * @param mode - The mode.
 * @param colour - The colour asked for, or null for the mode's own.
 * @returns The chords, the tonic first.
 */
function getCandidates(mode: Mode, colour: HarmonyValue<'colour'> | null): Candidate[] {
  const roles = mode.chords ? LISTED_ROLES : STEP_ROLES;
  const own = getModeChords(mode, false).map((numeral, i) => ({
    numeral,
    role: roles[i] ?? 'tonic-like',
  }));
  if (colour === null || colour === 'diatonic') return own;
  const isMinor = mode.steps.includes(MINOR_THIRD);
  const borrowed = isMinor ? FROM_MAJOR : FROM_MINOR;
  const added = colour === 'chromatic' ? [...borrowed, ...CHROMATIC] : borrowed;
  const extra = added.filter(
    ({ numeral }, i) =>
      !isInMode(numeral, mode) && added.findIndex((other) => other.numeral === numeral) === i,
  );
  return [...own, ...extra];
}

/**
 * Returns the lengths of a progression's chords, in bars, at a harmonic rhythm.
 *
 * @param bars - The bars the progression lasts.
 * @param rhythm - How often the chords change, or null for every bar.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The lengths, adding up to the bars.
 */
function getLengths(
  bars: number,
  rhythm: HarmonyValue<'rhythm'> | null,
  getRandom: () => number,
): number[] {
  const lengths: number[] = [];
  let bar = 0;
  while (bar < bars) {
    const isLast = bar === bars - 1;
    const chance = getRandom();
    if (rhythm === 'two-bars' && !isLast) {
      lengths.push(2);
      bar += 2;
      continue;
    }
    if (rhythm === 'half-bar') {
      lengths.push(0.5, 0.5);
    } else if (rhythm === 'varies' && !isLast && chance < HOLD_CHANCE) {
      lengths.push(2);
      bar += 1;
    } else if (rhythm === 'varies' && (isLast || chance < HOLD_CHANCE + SPLIT_CHANCE)) {
      lengths.push(0.5, 0.5);
    } else {
      lengths.push(1);
    }
    bar += 1;
  }
  return lengths;
}

/**
 * Returns the chords a progression ends with, for a cadence.
 *
 * @param cadence - The cadence asked for, or null for any ending.
 * @param candidates - The chords there are, the tonic first.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The last chords, in order; none when the ending is free.
 */
function getCadence(
  cadence: HarmonyValue<'cadence'> | null,
  candidates: Candidate[],
  getRandom: () => number,
): string[] {
  const tonic = candidates[0]?.numeral ?? 'I';
  const dominant = findChord(candidates, (read) => read.semitones === DOMINANT) ?? 'V';
  const subdominant = findChord(candidates, (read) => read.semitones === SUBDOMINANT) ?? 'IV';
  const submediant =
    findChord(candidates, (read) => read.degree === 5 && read.quality !== 'diminished') ?? '♭VI';
  const endings = {
    resolved: [dominant, tonic],
    half: [dominant],
    plagal: [subdominant, tonic],
    deceptive: [dominant, submediant],
    mario: ['♭VI', '♭VII', tonic],
    open: [pickChord(candidates.slice(1), getRandom)?.numeral ?? subdominant],
  } satisfies Record<HarmonyValue<'cadence'>, string[]>;
  if (cadence === null) return getRandom() < DOMINANT_ENDING_CHANCE ? [dominant] : [];
  return endings[cadence];
}

/**
 * Walks from the tonic: each chord one that can follow the one before, never the same twice.
 *
 * @param tonic - The first chord.
 * @param candidates - The chords there are.
 * @param count - How many chords to walk.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The chords, the tonic first.
 */
function walk(
  tonic: string,
  candidates: Candidate[],
  count: number,
  getRandom: () => number,
): string[] {
  const chords = [tonic];
  let role: ChordRole = 'tonic';
  while (chords.length < count) {
    const roles: ChordRole[] = NEXT_ROLES[role];
    const nextRole = roles[Math.floor(getRandom() * roles.length)] ?? 'tonic';
    const ofRole = candidates.filter((candidate) => candidate.role === nextRole);
    let next = pickChord(ofRole.length > 0 ? ofRole : candidates, getRandom);
    for (let i = 0; i < TRIES && next?.numeral === chords.at(-1); i += 1) {
      next = pickChord(candidates, getRandom);
    }
    chords.push(next?.numeral ?? tonic);
    role = next?.role ?? 'tonic';
  }
  return chords;
}

/**
 * Picks a chord at random, a diminished one seldom.
 *
 * @param candidates - The chords to pick from.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns One of them, or undefined when there are none.
 */
function pickChord(candidates: Candidate[], getRandom: () => number): Candidate | undefined {
  const plain = candidates.filter(({ numeral }) => readNumeral(numeral)?.quality !== 'diminished');
  const from = plain.length > 0 && getRandom() > DIMINISHED_CHANCE ? plain : candidates;
  return from[Math.floor(getRandom() * from.length)];
}

/**
 * Finds the first chord there is that fits a test, not diminished.
 *
 * @param candidates - The chords there are.
 * @param isFitting - The test, given the chord's numeral read.
 * @returns The chord's numeral, or undefined when none fits.
 */
function findChord(
  candidates: Candidate[],
  isFitting: (read: Numeral) => boolean,
): string | undefined {
  return candidates.find(({ numeral }) => {
    const read = readNumeral(numeral);
    return read !== null && read.quality !== 'diminished' && isFitting(read);
  })?.numeral;
}
