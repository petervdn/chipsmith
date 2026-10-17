// A progression written short reads into chords, numerals written the one way and lengths in bars,
// and is written back the same.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProgressionBars, readProgression, writeProgression } from './progression-notation.ts';
import { PROGRESSION_PRESETS } from './progression-presets.ts';

test('chords with their lengths, a bar when left out', () => {
  const { chords } = readProgression('iv | i, bVI V:½ V7:0.5 i:1½');
  assert.deepEqual(chords, [
    { numeral: 'iv', bars: 1 },
    { numeral: 'i', bars: 1 },
    { numeral: '♭VI', bars: 1 },
    { numeral: 'V', bars: 0.5 },
    { numeral: 'V7', bars: 0.5 },
    { numeral: 'i', bars: 1.5 },
  ]);
  assert.equal(writeProgression(chords ?? []), 'iv i ♭VI V:½ V7:½ i:1½');
  assert.equal(getProgressionBars(chords ?? []), 5.5);
});

test('what does not read says which chord', () => {
  assert.equal(readProgression('i Am').error, '"Am" is not a chord (like i, ♭VI, V7, iiø7)');
  assert.match(readProgression('i V:⅓').error ?? '', /^"V:⅓": a length/);
  assert.match(readProgression('i V:0').error ?? '', /^"V:0": a length/);
  assert.equal(readProgression('  ').error, 'no chords');
});

test('every preset reads', () => {
  assert.ok(PROGRESSION_PRESETS.length > 0);
  for (const preset of PROGRESSION_PRESETS) assert.ok(preset.chords.length > 0, preset.id);
});
