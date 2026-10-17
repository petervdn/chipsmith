// A harmony becomes lines of a prompt: its key, what its settings ask, a progression per part with
// its chords named in the key; nothing asked, no lines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getHarmonyLines, getHarmonySummary } from './harmony-prompt.ts';
import type { SentHarmony } from './harmony.types.ts';

const NOTHING: SentHarmony = {
  note: null,
  mode: null,
  settings: {
    chords: null,
    colour: null,
    rhythm: null,
    bass: null,
    cadence: null,
    keyChange: null,
  },
  strictness: 'exact',
  parts: [],
};

test('nothing asked, no lines', () => {
  assert.deepEqual(getHarmonyLines(NOTHING), []);
  assert.equal(getHarmonySummary(NOTHING), '');
});

test('the key, the settings and a progression per part', () => {
  const harmony: SentHarmony = {
    ...NOTHING,
    note: 'A',
    mode: 'minor',
    settings: { ...NOTHING.settings, chords: 'sevenths', rhythm: 'bar' },
    parts: [
      {
        letter: 'A',
        progression: {
          name: 'epic minor',
          chords: [
            { numeral: 'i', bars: 1 },
            { numeral: '♭VI', bars: 1 },
            { numeral: '♭III', bars: 1 },
            { numeral: '♭VII', bars: 1 },
          ],
        },
        variation: 'reharmonised',
      },
      {
        letter: 'B',
        progression: {
          name: '',
          chords: [
            { numeral: 'iv', bars: 2 },
            { numeral: 'V', bars: 0.5 },
            { numeral: 'V7', bars: 0.5 },
          ],
        },
        variation: 'same',
      },
      { letter: 'C', progression: null, variation: 'half-cadence' },
    ],
  };
  assert.deepEqual(getHarmonyLines(harmony), [
    '',
    'Harmony, for every song (follow it exactly); where the prompt itself names a key or chords, the prompt wins:',
    '- Key: A minor.',
    '- Chords: seventh chords; a chord every bar.',
    '- Progressions, as Roman numerals on the major scale of the key (♭VI is the major chord on the minor sixth), each repeated to fill its part:',
    '  - A: i ♭VI ♭III ♭VII (Am F C G), a bar each, 4 bars ("epic minor").',
    '  - A′ and other variations of A: it, with its last 2 bars reharmonised.',
    '  - B: iv Dm for 2 bars, V E for ½ bar, V7 E7 for ½ bar: 3 bars.',
    '  - C′ and other variations of C: the progression of C, with ending on the dominant (V).',
  ]);
  assert.equal(
    getHarmonySummary(harmony),
    'A minor · 7ths · every bar · A: i ♭VI ♭III ♭VII · B: iv:2 V:½ V7:½',
  );
});

test('a mode without a note: numerals, no names', () => {
  const harmony: SentHarmony = {
    ...NOTHING,
    mode: 'dorian',
    strictness: 'loose',
    parts: [
      {
        letter: null,
        progression: {
          name: 'dorian vamp',
          chords: [
            { numeral: 'i', bars: 2 },
            { numeral: 'IV', bars: 2 },
          ],
        },
        variation: 'same',
      },
    ],
  };
  assert.deepEqual(getHarmonyLines(harmony).slice(1, 3), [
    'Harmony, for every song (take it as a starting point, changing chords where the music asks for it); where the prompt itself names a key or chords, the prompt wins:',
    "- Mode: dorian, the key's note your choice.",
  ]);
  assert.equal(
    getHarmonyLines(harmony)[4],
    '  - The whole song: i IV, 2 bars each, 4 bars ("dorian vamp").',
  );
});
