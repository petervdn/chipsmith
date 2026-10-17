// The volume is in decibels: 0 dB is the audio as rendered, −6 dB about half, the lowest step off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METRONOME_LOUDEST_DB, QUIETEST_DB, formatVolume, getGain } from './volume.ts';

test('0 dB is as rendered, −6 dB about half, the lowest step silence', () => {
  assert.equal(getGain(0), 1);
  assert.equal(Math.round(getGain(-6) * 100) / 100, 0.5);
  assert.equal(getGain(QUIETEST_DB), 0);
  assert.equal(getGain(6), 1);
  assert.deepEqual([0, -12.4, 6, QUIETEST_DB].map(formatVolume), [
    '0 dB',
    '−12 dB',
    '+6 dB',
    'off',
  ]);
});

test('the metronome goes louder than the music', () => {
  assert.equal(Math.round(getGain(6, METRONOME_LOUDEST_DB) * 100) / 100, 2);
  assert.equal(
    getGain(40, METRONOME_LOUDEST_DB),
    getGain(METRONOME_LOUDEST_DB, METRONOME_LOUDEST_DB),
  );
});
