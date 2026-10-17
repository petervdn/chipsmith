// Peaks are the loudest sample of each stretch across the channels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PEAKS_PER_SECOND, getPeaks } from './clip-peaks.ts';

test('the loudest sample of each stretch, across the channels', () => {
  const rate = PEAKS_PER_SECOND * 2;
  const left = new Float32Array([0.1, -0.5, 0.2, 0.3]);
  const right = new Float32Array([0.2, 0.1, -0.9, 0]);
  assert.deepEqual(
    getPeaks([left, right], rate).map((peak) => Math.round(peak * 10) / 10),
    [0.5, 0.9],
  );
});
