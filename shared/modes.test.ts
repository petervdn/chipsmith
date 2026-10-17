// A mode's own chords are stacked in thirds from its steps (or listed, for the blues); a chord is
// the mode's own by its root and its triad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMode, getModeChords, isInMode, MODES } from './modes.ts';

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

test('the chords of the modes', () => {
  assert.deepEqual(getModeChords(getKnownMode('major'), false), [
    'I',
    'ii',
    'iii',
    'IV',
    'V',
    'vi',
    'vii°',
  ]);
  assert.deepEqual(getModeChords(getKnownMode('minor'), false), [
    'i',
    'ii°',
    '♭III',
    'iv',
    'v',
    '♭VI',
    '♭VII',
  ]);
  assert.deepEqual(getModeChords(getKnownMode('phrygian dominant'), false), [
    'I',
    '♭II',
    'iii°',
    'iv',
    'v°',
    '♭VI+',
    '♭vii',
  ]);
  assert.deepEqual(getModeChords(getKnownMode('harmonic minor'), false)[2], '♭III+');
  assert.deepEqual(getModeChords(getKnownMode('blues'), true), ['I7', 'IV7', 'V7']);
});

test('the seventh chords of a mode', () => {
  assert.deepEqual(getModeChords(getKnownMode('major'), true), [
    'Imaj7',
    'ii7',
    'iii7',
    'IVmaj7',
    'V7',
    'vi7',
    'viiø7',
  ]);
  assert.equal(getModeChords(getKnownMode('harmonic minor'), true)[6], 'vii°7');
});

test('a chord is the mode own by its root and its triad', () => {
  const minor = getKnownMode('minor');
  assert.ok(isInMode('♭VI', minor));
  assert.ok(isInMode('♭VImaj7', minor));
  assert.ok(isInMode('v5', minor));
  assert.ok(isInMode('V5', minor));
  assert.ok(!isInMode('V', minor));
  assert.ok(!isInMode('IV', minor));
  assert.ok(isInMode('iiø7', minor));
  assert.ok(isInMode('IV7', getKnownMode('blues')));
});

test('every mode has seven chords or a list', () => {
  for (const mode of MODES) assert.ok(getModeChords(mode, false).length > 0, mode.name);
});
