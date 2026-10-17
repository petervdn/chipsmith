// The structure's lane: each section one after another from the first bar, with its line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readNotation } from '../../shared/structure-notation.ts';
import { getStructureSpans } from './structure-lane.ts';

test('sections lie one after another from the first bar', () => {
  const sections = readNotation("A8(intro) B4 A'8").sections ?? [];
  const spans = getStructureSpans(
    sections.map((section, i) => (i === 1 ? { ...section, energy: 5, note: 'drums' } : section)),
  );
  assert.deepEqual(
    spans.map(({ name, startBar, bars, relation }) => ({ name, startBar, bars, relation })),
    [
      { name: 'A', startBar: 0, bars: 8, relation: 'new' },
      { name: 'B', startBar: 8, bars: 4, relation: 'new' },
      { name: 'A′', startBar: 12, bars: 8, relation: 'variation' },
    ],
  );
  assert.deepEqual(
    spans.map((span) => span.description),
    ['A: bars 1–8, intro', 'B: bars 9–12, energy 5 of 5, drums', 'A′: bars 13–20'],
  );
  assert.deepEqual(
    spans.map((span) => span.letterIndex),
    [0, 1, 0],
  );
});
