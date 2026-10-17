// A structure written short reads into sections and back; a letter heard again is a repeat, a ' a
// variation; a token that does not read is named in the error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRelation, keepDetails, readNotation, writeNotation } from './structure-notation.ts';

test("A8 A'8 B8 A8 C16(climax) reads and writes back", () => {
  const read = readNotation("A8 a'8 B, A C16(climax)");
  assert.equal(read.error, null);
  assert.ok(read.sections);
  assert.equal(writeNotation(read.sections), "A8 A'8 B8 A8 C16(climax)");
  assert.deepEqual(
    read.sections.map((_section, i) => getRelation(read.sections ?? [], i)),
    ['new', 'variation', 'new', 'repeat', 'new'],
  );
});

test('a token that does not read is named', () => {
  assert.equal(readNotation('A8 X!9').error, '"X!9" is not a section (like A8, A\'8, C16(climax))');
  assert.equal(readNotation('A0').error, '"A0": bars are 1 to 256');
  assert.equal(readNotation('  ').error, 'no sections');
});

test('energy and notes stay where the section is the same', () => {
  const before = readNotation('A8 B8').sections ?? [];
  const noted = before.map((section, i) =>
    i === 1 ? { ...section, energy: 4, note: 'loud' } : section,
  );
  const after = keepDetails(readNotation('A8 B16 C8').sections ?? [], noted);
  assert.deepEqual([after[1]?.energy, after[1]?.note, after[1]?.bars], [4, 'loud', 16]);
  const moved = keepDetails(readNotation('B8 A8').sections ?? [], noted);
  assert.deepEqual([moved[0]?.energy, moved[1]?.energy], [null, null]);
});
