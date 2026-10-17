// A time snaps to the nearest step of the grid: a bar, a note value, or a tick when the grid is off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRID_STEPS, getStepTicks, snapToGrid } from './grid.ts';

const [BAR, BEAT, , , OFF] = GRID_STEPS;

test('a time snaps to the nearest bar or beat, or a tick when the grid is off', () => {
  assert.ok(BAR && BEAT && OFF);
  assert.equal(snapToGrid(500, BAR, 384), 384);
  assert.equal(snapToGrid(600, BAR, 384), 768);
  assert.equal(snapToGrid(140, BEAT, 384), 96);
  assert.equal(snapToGrid(140.4, OFF, 384), 140);
  assert.equal(getStepTicks(OFF, 384), 1);
});
