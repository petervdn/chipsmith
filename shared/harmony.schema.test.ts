// A harmony that comes in is parsed by its schema: its scale, feel and colour each one there is, each
// chord a numeral and a length; numerals are written the one way, and what is left out is none.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sentHarmonySchema } from './harmony.schema.ts';
import { parseChecked } from './schema-parse.ts';

const HARMONY = {
  note: 'A',
  mode: 'minor',
  feel: 'dark',
  parts: [
    {
      letter: 'A',
      progression: { name: 'Epic', mode: 'minor', chords: [{ numeral: 'bVI', bars: 0.5 }] },
    },
  ],
};

test('a harmony reads, its numerals written the one way, what is left out as none', () => {
  const harmony = parseChecked(sentHarmonySchema, HARMONY, 'harmony');
  assert.equal(harmony.feel, 'dark');
  assert.equal(harmony.colour, null);
  assert.deepEqual(harmony.parts[0]?.progression.chords, [{ numeral: '♭VI', bars: 0.5 }]);
});

test('what does not fit says where', () => {
  assert.throws(
    () => parseChecked(sentHarmonySchema, { ...HARMONY, note: 'H' }, 'h'),
    /h\.note: is not one of/,
  );
  assert.throws(
    () => parseChecked(sentHarmonySchema, { ...HARMONY, feel: 'sad' }, 'h'),
    /h\.feel: is not one of/,
  );
  const badChord = {
    ...HARMONY,
    parts: [
      {
        letter: 'A',
        progression: { name: '', mode: 'minor', chords: [{ numeral: 'Am', bars: 1 }] },
      },
    ],
  };
  assert.throws(
    () => parseChecked(sentHarmonySchema, badChord, 'h'),
    /h\.parts\[0\]\.progression\.chords\[0\]\.numeral: is not a chord/,
  );
});
