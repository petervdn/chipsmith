// Stepping through the looks goes round at both ends, and an unknown look is the default one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LOOK, LOOKS, getLook, getNextLook } from './looks.ts';

test('the next look after the last is the first, and before the first the last', () => {
  const last = LOOKS.at(-1);
  assert.ok(last);
  assert.equal(getNextLook({ lookId: last.id, step: 1 }), DEFAULT_LOOK);
  assert.equal(getNextLook({ lookId: DEFAULT_LOOK.id, step: -1 }), last);
});

test('an unknown look is the default one', () => {
  assert.equal(getLook('gone'), DEFAULT_LOOK);
});

test('every look has an id of its own', () => {
  assert.equal(new Set(LOOKS.map((look) => look.id)).size, LOOKS.length);
});
