// A harmony that comes in is checked field by field: its scale, feel and colour each one there is,
// each chord a numeral and a length; numerals are written the one way, and none is no harmony.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSentHarmony } from './harmony-checks.ts';

const HARMONY = {
  note: 'A',
  mode: 'minor',
  feel: 'dark',
  colour: null,
  parts: [
    {
      letter: 'A',
      progression: { name: 'Epic', mode: 'minor', chords: [{ numeral: 'bVI', bars: 0.5 }] },
    },
  ],
};

test('a harmony reads, its numerals written the one way', () => {
  const harmony = checkSentHarmony(HARMONY, 'harmony');
  assert.equal(harmony?.feel, 'dark');
  assert.equal(harmony?.colour, null);
  assert.deepEqual(harmony?.parts[0]?.progression.chords, [{ numeral: '♭VI', bars: 0.5 }]);
  assert.equal(checkSentHarmony(undefined, 'harmony'), null);
});

test('what does not fit says where', () => {
  assert.throws(() => checkSentHarmony({ ...HARMONY, note: 'H' }, 'h'), /h\.note is not one of/);
  assert.throws(() => checkSentHarmony({ ...HARMONY, feel: 'sad' }, 'h'), /h\.feel is not one of/);
  const badChord = {
    ...HARMONY,
    parts: [
      {
        letter: 'A',
        progression: { name: '', mode: 'minor', chords: [{ numeral: 'Am', bars: 1 }] },
      },
    ],
  };
  assert.throws(() => checkSentHarmony(badChord, 'h'), /chords\[0\]\.numeral is not a chord/);
});
