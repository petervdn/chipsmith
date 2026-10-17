// A harmony that comes in is checked field by field: its key, each setting one of its options, each
// chord a numeral and a length; numerals are written the one way, and none is no harmony.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSentHarmony } from './harmony-checks.ts';

const HARMONY = {
  note: 'A',
  mode: 'minor',
  settings: { chords: 'sevenths', colour: null },
  strictness: 'exact',
  parts: [
    {
      letter: 'A',
      progression: { name: 'own', chords: [{ numeral: 'bVI', bars: 0.5 }] },
      variation: 'reharmonised',
    },
  ],
};

test('a harmony reads, its numerals written the one way, its settings left out as any', () => {
  const harmony = checkSentHarmony(HARMONY, 'harmony');
  assert.equal(harmony?.settings.chords, 'sevenths');
  assert.equal(harmony?.settings.cadence, null);
  assert.deepEqual(harmony?.parts[0]?.progression?.chords, [{ numeral: '♭VI', bars: 0.5 }]);
  assert.equal(checkSentHarmony(undefined, 'harmony'), null);
});

test('what does not fit says where', () => {
  assert.throws(() => checkSentHarmony({ ...HARMONY, note: 'H' }, 'h'), /h\.note is not a note/);
  assert.throws(
    () => checkSentHarmony({ ...HARMONY, settings: { chords: 'ninths' } }, 'h'),
    /h\.settings\.chords is not one of its options/,
  );
  const badChord = {
    ...HARMONY,
    parts: [{ letter: 'A', progression: { name: '', chords: [{ numeral: 'Am', bars: 1 }] } }],
  };
  assert.throws(
    () => checkSentHarmony(badChord, 'h'),
    /h\.parts\[0\]\.progression\.chords\[0\]\.numeral is not a chord/,
  );
  const badLength = {
    ...HARMONY,
    parts: [{ letter: 'A', progression: { name: '', chords: [{ numeral: 'i', bars: 0.3 }] } }],
  };
  assert.throws(() => checkSentHarmony(badLength, 'h'), /bars is not a length/);
});
