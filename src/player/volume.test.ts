// The volume is in decibels: 0 dB is the audio as rendered, −6 dB about half, the lowest step off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUIETEST_DB, formatVolume, getGain } from './volume.ts';

test('0 dB is as rendered, −6 dB about half, the lowest step silence', () => {
  assert.equal(getGain(0), 1);
  assert.equal(Math.round(getGain(-6) * 100) / 100, 0.5);
  assert.equal(getGain(QUIETEST_DB), 0);
  assert.equal(getGain(6), 1);
  assert.deepEqual([0, -12.4, QUIETEST_DB].map(formatVolume), ['0 dB', '−12 dB', 'off']);
});
