// A progression made up from the settings: as long as asked, from the tonic, ending on the cadence
// asked for, its chords the mode's own unless the colour borrows, in the kind of chords asked for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HarmonySettings } from '../../shared/harmony.types.ts';
import { getMode, isInMode } from '../../shared/modes.ts';
import { getProgressionBars } from '../../shared/progression-notation.ts';
import { generateProgression, getCycleBars, setChordKind } from './progression-generator.ts';

const OPEN: HarmonySettings = {
  chords: null,
  colour: null,
  rhythm: null,
  bass: null,
  cadence: null,
  keyChange: null,
};

/**
 * Returns numbers that look random and are the same every run.
 *
 * @param seed - Where they start.
 * @returns A function giving numbers from 0 up to 1.
 */
function getSeeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

/**
 * Returns a mode by its name, failing the test when there is none.
 *
 * @param name - The mode's name.
 * @returns The mode.
 */
function getKnownMode(name: string) {
  const mode = getMode(name);
  assert.ok(mode, name);
  return mode;
}

/**
 * Returns the last three chords of a progression made up in C major with a cadence.
 *
 * @param cadence - The cadence asked for.
 * @returns The numerals.
 */
function end(cadence: HarmonySettings['cadence']): string[] {
  const major = getKnownMode('major');
  const settings = { ...OPEN, cadence };
  return generateProgression({ mode: major, settings, bars: 4 }, getSeeded(7))
    .slice(-3)
    .map((chord) => chord.numeral);
}

/**
 * Returns the lengths of a progression's chords made up in major at a harmonic rhythm.
 *
 * @param rhythm - The harmonic rhythm asked for.
 * @param bars - The bars it lasts.
 * @returns The lengths, in bars.
 */
function lengths(rhythm: HarmonySettings['rhythm'], bars: number): number[] {
  const major = getKnownMode('major');
  const settings = { ...OPEN, rhythm };
  return generateProgression({ mode: major, settings, bars }, getSeeded(3)).map(
    (chord) => chord.bars,
  );
}

test('as long as asked, from the tonic, the mode own chords only', () => {
  const minor = getKnownMode('minor');
  for (let seed = 1; seed < 40; seed += 1) {
    const settings: HarmonySettings = { ...OPEN, colour: 'diatonic', rhythm: 'varies' };
    const chords = generateProgression({ mode: minor, settings, bars: 4 }, getSeeded(seed));
    assert.equal(getProgressionBars(chords), 4, `seed ${seed}`);
    assert.equal(chords[0]?.numeral, 'i');
    for (const chord of chords) assert.ok(isInMode(chord.numeral, minor), chord.numeral);
  }
});

test('the cadence asked for ends it', () => {
  assert.deepEqual(end('resolved').slice(-2), ['V', 'I']);
  assert.deepEqual(end('plagal').slice(-2), ['IV', 'I']);
  assert.deepEqual(end('deceptive').slice(-2), ['V', 'vi']);
  assert.deepEqual(end('mario'), ['♭VI', '♭VII', 'I']);
  assert.deepEqual(end('half').slice(-1), ['V']);
});

test('chords at the harmonic rhythm asked for', () => {
  assert.deepEqual(lengths('two-bars', 8), [2, 2, 2, 2]);
  assert.deepEqual(lengths('half-bar', 2), [0.5, 0.5, 0.5, 0.5]);
  assert.deepEqual(lengths('bar', 4), [1, 1, 1, 1]);
});

test('the kind of chords asked for', () => {
  const minor = getKnownMode('minor');
  assert.equal(setChordKind('V', 'sevenths', minor), 'V7');
  assert.equal(setChordKind('♭VI', 'sevenths', minor), '♭VImaj7');
  assert.equal(setChordKind('ii°', 'sevenths', minor), 'iiø7');
  assert.equal(setChordKind('iv', 'sevenths', minor), 'iv7');
  assert.equal(setChordKind('iv', 'power', minor), 'IV5');
  assert.equal(setChordKind('Imaj7', 'triads', minor), 'I');
  assert.equal(setChordKind('IV', 'sevenths', getKnownMode('major')), 'IVmaj7');
  assert.equal(setChordKind('iv', null, minor), 'iv');
});

test('a part goes round in 4 bars, 8 when chords last 2, or its own bars', () => {
  assert.equal(getCycleBars(8, 'bar'), 4);
  assert.equal(getCycleBars(8, 'two-bars'), 8);
  assert.equal(getCycleBars(6, null), 6);
  assert.equal(getCycleBars(2, null), 2);
  assert.equal(getCycleBars(null, null), 4);
  assert.equal(getCycleBars(10, null), 4);
});
