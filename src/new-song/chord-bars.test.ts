// A progression reads bar by bar: chords sharing a bar side by side, a held bar marked –.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProgression } from '../../shared/progression-notation.ts';
import { writeChordBars } from './chord-bars.ts';

/**
 * Reads a progression written short, failing the test when it does not read.
 *
 * @param notation - The progression written short.
 * @returns Its chords.
 */
function read(notation: string) {
  const { chords } = readProgression(notation);
  assert.ok(chords, notation);
  return chords;
}

test('a chord a bar, two to a bar, one held through two', () => {
  assert.equal(writeChordBars(read('i ♭VI ♭III ♭VII'), 'A'), 'Am | F | C | G');
  assert.equal(writeChordBars(read('I IV ♭VI:½ ♭VII:½ I'), 'C'), 'C | F | A♭ B♭ | C');
  assert.equal(writeChordBars(read('ii7 V7 Imaj7:2'), 'C'), 'Dm7 | G7 | Cmaj7 | –');
  assert.equal(writeChordBars(read('i:1½ iv:½ V:2'), null), 'i | – iv | V | –');
});
