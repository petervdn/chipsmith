// A tooltip goes under what it is for, above it at the window's foot, and never past an edge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTooltipPlace } from './tooltip-place.ts';

const VIEWPORT = { width: 400, height: 800 };
const SIZE = { width: 100, height: 30 };

test('under what it is for, centred on it', () => {
  const target = { left: 150, top: 100, right: 250, bottom: 140 };
  assert.deepEqual(getTooltipPlace({ target, size: SIZE, viewport: VIEWPORT }), {
    left: 150,
    top: 146,
  });
});

test('above it when there is no room under it', () => {
  const target = { left: 150, top: 750, right: 250, bottom: 790 };
  assert.deepEqual(getTooltipPlace({ target, size: SIZE, viewport: VIEWPORT }), {
    left: 150,
    top: 714,
  });
});

test('kept inside the window at its sides', () => {
  const atLeft = { left: 0, top: 100, right: 20, bottom: 140 };
  const atRight = { left: 380, top: 100, right: 400, bottom: 140 };
  assert.equal(getTooltipPlace({ target: atLeft, size: SIZE, viewport: VIEWPORT }).left, 8);
  assert.equal(getTooltipPlace({ target: atRight, size: SIZE, viewport: VIEWPORT }).left, 292);
});
