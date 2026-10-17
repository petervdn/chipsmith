// A structure becomes a line per section: where it falls in bars, new, a variation or a repeat, and
// its role, energy and note.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readNotation } from './structure-notation.ts';
import { STRUCTURE_PRESETS } from './structure-presets.ts';
import { getStructureLines } from './structure-prompt.ts';

test('a line per section, with its bars and how it stands to those before', () => {
  const sections = readNotation("A8(intro) A'8 B4 A8").sections ?? [];
  const withEnergy = sections.map((section, i) =>
    i === 2
      ? { ...section, energy: 5, note: 'only drums', leadIn: ['bar-fill', 'walk-in'] }
      : i === 0
        ? { ...section, leadIn: ['pickup'] }
        : section,
  );
  assert.deepEqual(getStructureLines({ name: 'Test', sections: withEnergy }), [
    '',
    `Structure "Test" (A8(intro) A'8 B4 A8, 28 bars in all), to follow for every song; a letter is a part, a ′ a variation of it:`,
    '1. A, bars 1–8 (8 bars): a new part; intro.',
    '2. A′, bars 9–16 (8 bars): a variation of A: the same material, changed.',
    "3. B, bars 17–20 (4 bars): a new part; energy 5 of 5; only drums; led into from the section before, at its end, with a full-bar drum fill, the bass walking into the new section's root.",
    '4. A, bars 21–28 (8 bars): A again, as it was.',
  ]);
});

test('every preset reads', () => {
  assert.ok(STRUCTURE_PRESETS.length > 0);
  for (const preset of STRUCTURE_PRESETS) assert.ok(preset.sections.length > 0, preset.id);
});
