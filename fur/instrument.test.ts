// Instruments and wavetables come out byte for byte as the Python writer made them
// (python-vectors.json: made once with tools/fur.py of the archive branch).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Macro } from './instrument.ts';
import { makeInstrument, makeWavetable } from './instrument.ts';

type InstrumentVector = { case: { name: string; type: number; macros: Macro[] }; hex: string };
type WavetableVector = { wave: { samples: number[]; name: string }; hex: string };

function isInstrumentVector(vector: unknown): vector is InstrumentVector {
  return typeof vector === 'object' && vector !== null && 'case' in vector;
}

function isWavetableVector(vector: unknown): vector is WavetableVector {
  return typeof vector === 'object' && vector !== null && 'wave' in vector;
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

const vectors: unknown = JSON.parse(
  readFileSync(join(import.meta.dirname, 'python-vectors.json'), 'utf8'),
);
const list = Array.isArray(vectors) ? vectors : [];

test('instruments are written as the Python writer wrote them', () => {
  const instruments = list.filter(isInstrumentVector);
  assert.ok(instruments.length > 0);
  for (const { case: spec, hex } of instruments) {
    assert.equal(toHex(makeInstrument(spec.name, spec.type, spec.macros)), hex, spec.name);
  }
});

test('wavetables are written as the Python writer wrote them', () => {
  const wavetables = list.filter(isWavetableVector);
  assert.ok(wavetables.length > 0);
  for (const { wave, hex } of wavetables) {
    assert.equal(toHex(makeWavetable(wave.samples, wave.name)), hex, wave.name);
  }
});
