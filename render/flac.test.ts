// A FLAC's length, read from its header.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFlacSeconds } from './flac.ts';

test('the length is the samples over the sample rate', () => {
  const header = new Uint8Array(26);
  header.set([0x66, 0x4c, 0x61, 0x43]);
  // 44100 Hz in 20 bits, then 2 channels and 16 bits, then 88200 samples in 36 bits
  const sampleRate = 44100;
  header[18] = sampleRate >> 12;
  header[19] = (sampleRate >> 4) & 0xff;
  header[20] = ((sampleRate & 0x0f) << 4) | (1 << 1);
  header[21] = 15 << 4;
  header.set([0x00, 0x01, 0x58, 0x88], 22);
  assert.equal(getFlacSeconds(header), 2);
});

test('bytes that are not a FLAC say nothing', () => {
  assert.equal(getFlacSeconds(new Uint8Array(26)), null);
  assert.equal(getFlacSeconds(new Uint8Array(4)), null);
});
