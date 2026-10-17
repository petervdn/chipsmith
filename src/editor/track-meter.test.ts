// A track's meter jumps up at once, eases down, and its peak mark holds before it falls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR_DECIBELS,
  SILENT_METER,
  getDecibels,
  getMeterShare,
  isSettled,
  stepMeter,
} from './track-meter.ts';
import type { MeterState } from './track-meter.ts';

const FRAME = 1 / 60;

function runFrames(meter: MeterState, input: number, frames: number): MeterState {
  let state = meter;
  for (let i = 0; i < frames; i++) state = stepMeter(state, input, FRAME);
  return state;
}

test('decibels from an amplitude, no quieter than the floor', () => {
  assert.equal(getDecibels(1), 0);
  assert.equal(Math.round(getDecibels(0.5)), -6);
  assert.equal(getDecibels(0), FLOOR_DECIBELS);
  assert.equal(getDecibels(0.00001), FLOOR_DECIBELS);
});

test('a louder level shows at once, with the peak mark on it', () => {
  const meter = stepMeter(SILENT_METER, -6, FRAME);
  assert.equal(meter.level, -6);
  assert.equal(meter.peak, -6);
});

test('the level eases down, quickly at first', () => {
  const loud = stepMeter(SILENT_METER, -6, FRAME);
  const first = stepMeter(loud, FLOOR_DECIBELS, FRAME);
  const second = stepMeter(first, FLOOR_DECIBELS, FRAME);
  assert.ok(first.level < -6);
  assert.ok(loud.level - first.level > first.level - second.level);
});

test('the peak mark holds a while, then falls faster and faster', () => {
  const loud = stepMeter(SILENT_METER, -6, FRAME);
  const held = runFrames(loud, FLOOR_DECIBELS, 60);
  assert.equal(held.peak, -6);
  const falling = runFrames(held, FLOOR_DECIBELS, 15);
  const fallen = runFrames(falling, FLOOR_DECIBELS, 15);
  assert.ok(falling.peak < -6);
  assert.ok(falling.peak - fallen.peak > -6 - falling.peak);
});

test('a meter left in silence settles at its floor', () => {
  const loud = stepMeter(SILENT_METER, 0, FRAME);
  assert.equal(isSettled(loud), false);
  assert.equal(isSettled(runFrames(loud, FLOOR_DECIBELS, 300)), true);
});

test('the meter is drawn from the floor to full scale', () => {
  assert.deepEqual([FLOOR_DECIBELS, FLOOR_DECIBELS / 2, 0, 3].map(getMeterShare), [0, 0.5, 1, 1]);
});
