// A loop's passes join on one clock, and a second on that clock is the place in the loop it has
// come round to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLoopFrom, getLoopPass, getLoopedSecond } from './loop.ts';

const LOOP = { start: 4, end: 10 };

test('play starts where asked, or at the loop when asked at or past its end', () => {
  assert.equal(getLoopFrom(2, LOOP), 2);
  assert.equal(getLoopFrom(6, LOOP), 6);
  assert.equal(getLoopFrom(10, LOOP), 4);
  assert.equal(getLoopFrom(12, LOOP), 4);
});

test('each pass follows the one before', () => {
  assert.deepEqual(getLoopPass(LOOP, 1), { at: 10, shift: 6 });
  assert.deepEqual(getLoopPass(LOOP, 2), { at: 16, shift: 12 });
});

test('a second on the play clock is the place in the loop', () => {
  assert.equal(getLoopedSecond(7, LOOP), 7);
  assert.equal(getLoopedSecond(10, LOOP), 4);
  assert.equal(getLoopedSecond(13, LOOP), 7);
  assert.equal(getLoopedSecond(16.5, LOOP), 4.5);
  assert.equal(getLoopedSecond(13, null), 13);
});
