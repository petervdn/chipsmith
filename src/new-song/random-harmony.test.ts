// The harmony's parts follow the structure's letters; rolling keeps what is locked; what is sent
// leaves out what asks for nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { VariationEnding } from '../../shared/harmony-settings.ts';
import { readNotation } from '../../shared/structure-notation.ts';
import {
  getHarmonyParts,
  getPartLock,
  getProgressionFit,
  getSentHarmony,
  OPEN_HARMONY,
  rollHarmony,
} from './random-harmony.ts';

test('a part per letter, in order, or the whole song', () => {
  const sections = readNotation("A8 A'8 B4 A8 C16").sections;
  assert.deepEqual(getHarmonyParts(sections), [
    { key: 'A', letter: 'A', bars: 8, hasVariations: true },
    { key: 'B', letter: 'B', bars: 4, hasVariations: false },
    { key: 'C', letter: 'C', bars: 16, hasVariations: false },
  ]);
  assert.deepEqual(getHarmonyParts(null), [
    { key: 'whole', letter: null, bars: null, hasVariations: false },
  ]);
});

test('nothing asked, nothing sent', () => {
  assert.equal(getSentHarmony(OPEN_HARMONY, getHarmonyParts(null)), null);
});

test('rolling picks every unlocked row and part, and keeps the locked ones', () => {
  const parts = getHarmonyParts(readNotation('A8 B8').sections);
  const [partA, partB] = parts;
  assert.ok(partA && partB);
  const kept = { ...OPEN_HARMONY, note: 'D', progressions: { [partB.key]: null } };
  const rolled = rollHarmony(kept, parts, ['note', getPartLock(partB)], () => 0.5);
  assert.equal(rolled.note, 'D');
  assert.ok(rolled.mode !== null);
  assert.ok(Object.values(rolled.settings).every((value) => value !== null));
  assert.ok(rolled.progressions['A']);
  assert.equal(rolled.progressions['B'], null);
  const sent = getSentHarmony(rolled, parts);
  assert.deepEqual(
    sent?.parts.map((part) => part.letter),
    ['A'],
  );
});

test('a variation ending is sent only for a part that has variations', () => {
  const parts = getHarmonyParts(readNotation("A8 A'8 B8").sections);
  const variations: Record<string, VariationEnding> = Object.fromEntries([
    ['A', 'reharmonised'],
    ['B', 'half-cadence'],
  ]);
  const choice = { ...OPEN_HARMONY, variations };
  assert.deepEqual(getSentHarmony(choice, parts)?.parts, [
    { letter: 'A', progression: null, variation: 'reharmonised' },
  ]);
});

test('how a progression fills its part', () => {
  const [part] = getHarmonyParts(readNotation('A8').sections);
  assert.ok(part);
  for (const [bars, fit] of [
    [4, "4 bars, 2 times round in A's 8"],
    [8, "8 bars, all of A's 8"],
    [3, "3 bars: A's 8 do not divide by it"],
  ] as const) {
    assert.equal(getProgressionFit([{ numeral: 'i', bars }], part), fit);
  }
});
