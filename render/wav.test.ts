// A WAV's length is read from its header, past chunks that are not its format or its data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ByteWriter } from '../fur/bytes.ts';
import { getWavFacts } from './wav.ts';

function makeWav(seconds: number): Uint8Array {
  const sampleRate = 44100;
  const dataSize = seconds * sampleRate * 4;
  return new ByteWriter()
    .ascii('RIFF')
    .u32(36 + 12 + dataSize)
    .ascii('WAVE')
    .ascii('LIST')
    .u32(4)
    .ascii('INFO')
    .ascii('fmt ')
    .u32(16)
    .u16(1)
    .u16(2)
    .u32(sampleRate)
    .u32(sampleRate * 4)
    .u16(4)
    .u16(16)
    .ascii('data')
    .u32(dataSize)
    .getBytes();
}

test('the length of a WAV is read from its header', () => {
  assert.deepEqual(getWavFacts(makeWav(2)), {
    sampleRate: 44100,
    channels: 2,
    bits: 16,
    seconds: 2,
  });
});

test('a file that is not a WAV is an error', () => {
  assert.throws(() => getWavFacts(new TextEncoder().encode('not a wav at all')));
});
