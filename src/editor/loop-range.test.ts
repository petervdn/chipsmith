// The editor's loop: the whole song to start with, a block's bars, and where each kind of drag puts
// it, in bars.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBlockRange, getDraggedRange, getLoopSeconds, getWholeSongRange } from './loop-range.ts';

const RANGE = { startBar: 4, endBar: 8 };

test('the whole song loops to the bar line nearest its end', () => {
  assert.deepEqual(getWholeSongRange(32 * 16 + 3, 16), { startBar: 0, endBar: 32 });
  assert.deepEqual(getWholeSongRange(0, 16), { startBar: 0, endBar: 1 });
});

test('an edge moves, and keeps the loop a bar long at least', () => {
  const drag = { range: RANGE, pressBar: 4, bars: 20 };
  assert.deepEqual(getDraggedRange({ ...drag, mode: 'start', bar: 2 }), { startBar: 2, endBar: 8 });
  assert.deepEqual(getDraggedRange({ ...drag, mode: 'start', bar: 9 }), { startBar: 7, endBar: 8 });
  assert.deepEqual(getDraggedRange({ ...drag, mode: 'end', bar: 3 }), { startBar: 4, endBar: 5 });
  assert.deepEqual(getDraggedRange({ ...drag, mode: 'end', bar: 30 }), { startBar: 4, endBar: 20 });
});

test('the loop moves whole, within the timeline', () => {
  const drag = { range: RANGE, pressBar: 5, bars: 10, mode: 'move' as const };
  assert.deepEqual(getDraggedRange({ ...drag, bar: 7 }), { startBar: 6, endBar: 10 });
  assert.deepEqual(getDraggedRange({ ...drag, bar: 9 }), { startBar: 6, endBar: 10 });
  assert.deepEqual(getDraggedRange({ ...drag, bar: 0 }), { startBar: 0, endBar: 4 });
});

test('a new loop is drawn either way, a bar long at least', () => {
  const drag = { range: RANGE, pressBar: 6, bars: 10, mode: 'draw' as const };
  assert.deepEqual(getDraggedRange({ ...drag, bar: 9 }), { startBar: 6, endBar: 9 });
  assert.deepEqual(getDraggedRange({ ...drag, bar: 2 }), { startBar: 2, endBar: 6 });
  assert.deepEqual(getDraggedRange({ ...drag, bar: 6 }), { startBar: 6, endBar: 7 });
  assert.deepEqual(getDraggedRange({ ...drag, pressBar: 10, bar: 10 }), {
    startBar: 9,
    endBar: 10,
  });
});

test('bars become seconds', () => {
  assert.deepEqual(getLoopSeconds(RANGE, 2), { start: 8, end: 16 });
});

test('a block loops from the bar it starts in to the bar line at or after its end', () => {
  assert.deepEqual(getBlockRange({ start: 32, end: 64 + 8 }, 16), { startBar: 2, endBar: 5 });
  assert.deepEqual(getBlockRange({ start: 0, end: 64 }, 16), { startBar: 0, endBar: 4 });
  assert.deepEqual(getBlockRange({ start: 0, end: 64.1 }, 16), { startBar: 0, endBar: 4 });
  assert.deepEqual(getBlockRange({ start: 16, end: 16 }, 16), { startBar: 1, endBar: 2 });
});
