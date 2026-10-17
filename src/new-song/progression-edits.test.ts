// A progression's chords are changed, copied, moved and removed, the last one always kept.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeChord, duplicateChord, moveChord, removeChord } from './progression-edits.ts';

const CHORDS = [
  { numeral: 'i', bars: 1 },
  { numeral: '♭VI', bars: 1 },
  { numeral: 'V', bars: 2 },
];

test('a chord changed, copied, moved and removed', () => {
  assert.deepEqual(changeChord(CHORDS, 1, { bars: 0.5 })[1], { numeral: '♭VI', bars: 0.5 });
  assert.deepEqual(
    duplicateChord(CHORDS, 0).map((chord) => chord.numeral),
    ['i', 'i', '♭VI', 'V'],
  );
  assert.deepEqual(
    moveChord(CHORDS, 2, -1).map((chord) => chord.numeral),
    ['i', 'V', '♭VI'],
  );
  assert.equal(moveChord(CHORDS, 2, 1), CHORDS);
  assert.deepEqual(
    removeChord(CHORDS, 0).map((chord) => chord.numeral),
    ['♭VI', 'V'],
  );
});

test('the last chord stays', () => {
  const one = [{ numeral: 'I', bars: 4 }];
  assert.equal(removeChord(one, 0), one);
});
