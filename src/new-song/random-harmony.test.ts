// The harmony's parts follow the structure's letters; rolling keeps what is locked; presets to hear
// fit the scale and feel; a kept progression sets the scale when none was chosen; what is sent
// leaves out what asks for nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESSION_PRESETS } from '../../shared/progression-presets.ts';
import { readNotation } from '../../shared/structure-notation.ts';
import {
  dropProgression,
  getHarmonyParts,
  getHearingNote,
  getSentHarmony,
  keepProgression,
  OPEN_HARMONY,
  pickCandidates,
  rollHarmony,
} from './random-harmony.ts';

test('a part per letter, in order, or the whole song', () => {
  assert.deepEqual(getHarmonyParts(readNotation("A8 A'8 B4 A8 C16").sections), [
    { key: 'A', letter: 'A' },
    { key: 'B', letter: 'B' },
    { key: 'C', letter: 'C' },
  ]);
  assert.deepEqual(getHarmonyParts(null), [{ key: 'whole', letter: null }]);
});

test('nothing asked, nothing sent', () => {
  assert.equal(getSentHarmony(OPEN_HARMONY, getHarmonyParts(null)), null);
});

test('rolling picks the unlocked rows and keeps the locked ones', () => {
  const rolled = rollHarmony({ ...OPEN_HARMONY, note: 'D' }, ['note'], () => 0.5);
  assert.equal(rolled.note, 'D');
  assert.ok(rolled.mode && rolled.feel && rolled.colour);
});

test('presets to hear fit the scale and the feel, never the same twice in a pick', () => {
  const choice = { ...OPEN_HARMONY, mode: 'minor', feel: 'dark' };
  const picked = pickCandidates(choice, 3, [], () => 0);
  assert.equal(picked.length, 3);
  assert.equal(new Set(picked.map((preset) => preset.id)).size, 3);
  for (const preset of picked) {
    assert.ok(preset.modes.includes('minor') && preset.feels.includes('dark'), preset.id);
  }
});

test('a kept progression sets the scale when none was chosen, and is sent for its part', () => {
  const [part] = getHarmonyParts(readNotation('A8 B8').sections);
  const epic = PROGRESSION_PRESETS.find((preset) => preset.id === 'epic-minor');
  assert.ok(part && epic);
  const kept = keepProgression(OPEN_HARMONY, part, epic);
  assert.equal(kept.mode, 'minor');
  assert.equal(getHearingNote(kept), 'A');
  assert.deepEqual(
    getSentHarmony(kept, getHarmonyParts(readNotation('A8 B8').sections))?.parts.map(
      ({ letter, progression }) => [letter, progression.name, progression.mode],
    ),
    [['A', 'Epic', 'minor']],
  );
  assert.deepEqual(dropProgression(kept, part).progressions, {});
});
