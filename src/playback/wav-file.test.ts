// Tests of wav-file.ts: the WAV's header says what it holds, its samples are interleaved and
// clipped at full scale, and the peak is the loudest sample.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getWavFacts } from '../../render/wav.ts';
import { getPeak, getWavBytes } from './wav-file.ts';

test('a WAV says its rate, channels, bits and length', () => {
  const channels = [new Float32Array(48000), new Float32Array(48000)];
  assert.deepEqual(getWavFacts(getWavBytes(channels, 48000)), {
    sampleRate: 48000,
    channels: 2,
    bits: 16,
    seconds: 1,
  });
});

test('the samples are interleaved, left first, and clipped at full scale', () => {
  const bytes = getWavBytes([new Float32Array([0.5, 2]), new Float32Array([-0.5, -2])], 44100);
  const view = new DataView(bytes.buffer, 44);
  assert.deepEqual(
    [0, 2, 4, 6].map((offset) => view.getInt16(offset, true)),
    [16384, -16383, 32767, -32767],
  );
});

test('the peak is the loudest sample of any channel, past full scale too', () => {
  assert.equal(getPeak([new Float32Array([0.25, -0.5]), new Float32Array([1.5, 0])]), 1.5);
  assert.equal(getPeak([]), 0);
});
