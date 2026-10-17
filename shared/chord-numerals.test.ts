// A numeral reads as typed (b, #, o) and is written the one way; a chord is named in a key, its root
// spelled from the key's letter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChordName, normalizeNumeral, readNumeral } from './chord-numerals.ts';

test('a numeral is written the one way, however it was typed', () => {
  assert.equal(normalizeNumeral('bVI'), '♭VI');
  assert.equal(normalizeNumeral('#iv°'), '♯iv°');
  assert.equal(normalizeNumeral('viio'), 'vii°');
  assert.equal(normalizeNumeral('iiø'), 'iiø7');
  assert.equal(normalizeNumeral('Imaj7'), 'Imaj7');
});

test('what is not a numeral does not read', () => {
  for (const text of ['', 'X', 'IIII', 'I°', 'i+', 'V13', 'Am']) {
    assert.equal(readNumeral(text), null, text);
  }
});

test('a numeral read: its degree, its root above the key, its quality', () => {
  assert.deepEqual(readNumeral('♭VI'), {
    degree: 5,
    semitones: 8,
    quality: 'major',
    addition: '',
  });
  assert.deepEqual(readNumeral('ii7')?.quality, 'minor');
});

/**
 * Names chords in a key.
 *
 * @param note - The key's note.
 * @param numerals - The chords' numerals.
 * @returns Their names.
 */
function names(note: string, numerals: string[]): (string | null)[] {
  return numerals.map((numeral) => getChordName(numeral, note));
}

test('chords are named in the key, spelled from its letter', () => {
  assert.deepEqual(names('A', ['i', '♭VI', '♭III', '♭VII']), ['Am', 'F', 'C', 'G']);
  assert.deepEqual(names('C', ['i', '♭VI', '♭III', '♭VII']), ['Cm', 'A♭', 'E♭', 'B♭']);
  assert.deepEqual(names('C♯', ['i', '♭II', '♭vii', 'v°']), ['C♯m', 'D', 'Bm', 'G♯dim']);
  assert.deepEqual(names('E♭', ['IV', 'V7', 'iiø7', 'vii°7']), ['A♭', 'B♭7', 'Fm7♭5', 'Ddim7']);
  assert.deepEqual(names('G', ['Imaj7', 'ii7', 'IV5', 'Vsus4']), ['Gmaj7', 'Am7', 'C5', 'Dsus4']);
});

test('a spelling that would need two accidentals, or is awkward, is the note it sounds', () => {
  assert.equal(getChordName('♭III', 'A♭'), 'B');
  assert.equal(getChordName('♯IV', 'F♯'), 'C');
});
