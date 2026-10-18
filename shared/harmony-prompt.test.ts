// A harmony becomes lines of a prompt: its scale and how it sounds, its feel and colour, and each
// progression kept with its chords named in the key; nothing asked, no lines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getHarmonyLines, getHarmonySummary } from './harmony-prompt.ts';
import type { SentHarmony } from './harmony.schema.ts';

const NOTHING: SentHarmony = { note: null, mode: null, feel: null, colour: null, parts: [] };

const EPIC = {
  name: 'Epic',
  mode: 'minor',
  chords: [
    { numeral: 'i', bars: 1 },
    { numeral: '♭VI', bars: 1 },
    { numeral: '♭III', bars: 1 },
    { numeral: '♭VII', bars: 1 },
  ],
};

test('nothing asked, no lines', () => {
  assert.deepEqual(getHarmonyLines(NOTHING), []);
  assert.equal(getHarmonySummary(NOTHING), '');
});

test('the scale, the feel, the colour and a progression per part', () => {
  const harmony: SentHarmony = {
    note: 'A',
    mode: 'minor',
    feel: 'dark',
    colour: 'little',
    parts: [{ letter: 'A', progression: EPIC }],
  };
  const lines = getHarmonyLines(harmony);
  assert.equal(lines[2], '- Scale: A minor (sad, serious).');
  assert.match(lines[3] ?? '', /^- Feel: dark: minor chords/);
  assert.match(lines[4] ?? '', /^- Colour: now and then a chord borrowed/);
  assert.match(
    lines[5] ?? '',
    /^- A's progression, heard and chosen: i ♭VI ♭III ♭VII \(Am F C G\), a bar each, 4 bars round;/,
  );
  assert.equal(getHarmonySummary(harmony), 'A minor · dark · a little colour · A: Epic (Am F C G)');
});

test('a scale without a note: numerals only', () => {
  const harmony: SentHarmony = {
    ...NOTHING,
    mode: 'dorian',
    parts: [{ letter: null, progression: EPIC }],
  };
  const lines = getHarmonyLines(harmony);
  assert.equal(
    lines[2],
    '- Scale: dorian (minor but hopeful, a bright sixth; funky, folky), on a note of your choice.',
  );
  assert.match(
    lines[3] ?? '',
    /^- The song's progression, heard and chosen: i ♭VI ♭III ♭VII, a bar each/,
  );
});
