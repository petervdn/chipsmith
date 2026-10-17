// A section is added with the next free letter, copied after itself, moved and removed; a section can
// become any part or variant in the structure, a next variation of one, or a new part.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readNotation, writeNotation } from '../../shared/structure-notation.ts';
import {
  addSection,
  changeSection,
  duplicateSection,
  getPartChoices,
  moveSection,
  removeSection,
} from './structure-edits.ts';

const SECTIONS = readNotation("A8 A'8 B4").sections ?? [];

test('add, copy, move, remove and change', () => {
  assert.equal(writeNotation(addSection(SECTIONS)), "A8 A'8 B4 C8");
  assert.equal(writeNotation(duplicateSection(SECTIONS, 2)), "A8 A'8 B4 B4");
  assert.equal(writeNotation(moveSection(SECTIONS, 2, -1)), "A8 B4 A'8");
  assert.equal(writeNotation(moveSection(SECTIONS, 0, -1)), "A8 A'8 B4");
  assert.equal(writeNotation(removeSection(SECTIONS, 1)), 'A8 B4');
  assert.equal(
    writeNotation(changeSection(SECTIONS, 2, { bars: 16, role: 'climax' })),
    "A8 A'8 B16(climax)",
  );
});

test('a section can be any part, the next variation of one, or a new part', () => {
  assert.deepEqual(
    getPartChoices(SECTIONS).map(({ letter, variant }) => letter + "'".repeat(variant)),
    ['A', "A'", "A''", 'B', "B'", 'C'],
  );
});
