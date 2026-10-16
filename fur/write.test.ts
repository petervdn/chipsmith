// A module written and read back is the same module, and its file starts as a .fur does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FurModule } from './fur.types.ts';
import { makeInstrument, makeWavetable, NES_INSTRUMENT } from './instrument.ts';
import { getNoteValue } from './notes.ts';
import { getUncompressed, readModule } from './read.ts';
import { getFurFile, getModuleBytes } from './write.ts';

const NES_AND_SCC: FurModule = {
  song: {
    name: 'test',
    author: 'Claude',
    systemName: 'NES + Konami SCC+',
    comment: '',
    chips: [0x06, 0xb4],
    chipVolumes: [1, 0.7],
    chipFlags: ['', null],
    channelCount: 10,
    tickRate: 60,
    speeds: [6],
    virtualTempo: { numerator: 150, denominator: 150 },
    patternLength: 64,
    highlights: { first: 4, second: 16 },
    orders: Array.from({ length: 10 }, () => [0, 1]),
    effectColumns: Array.from({ length: 10 }, () => 1),
  },
  instruments: [makeInstrument('lead', NES_INSTRUMENT, [{ kind: 'vol', values: [15, 10] }])],
  wavetables: [makeWavetable(Array.from({ length: 32 }, (_slot, i) => i * 8))],
  patterns: [
    {
      channel: 0,
      index: 0,
      rows: Array.from({ length: 64 }, (_slot, i) =>
        i % 4 === 0
          ? {
              note: getNoteValue('D-3'),
              instrument: 0,
              volume: 15,
              effects: [{ code: 0x12, value: 2 }],
            }
          : null,
      ),
    },
    { channel: 0, index: 1, rows: Array.from({ length: 64 }, () => null) },
  ],
};

test('a module written and read back is the same module', () => {
  const file = getFurFile(NES_AND_SCC);
  const module = readModule(file);
  assert.deepEqual(module.song, NES_AND_SCC.song);
  assert.deepEqual(module.patterns, NES_AND_SCC.patterns);
  assert.deepEqual(getModuleBytes(module), getUncompressed(file));
});

test('the file is compressed, and starts as a .fur does once uncompressed', () => {
  const file = getFurFile(NES_AND_SCC);
  const magic = '-Furnace module-';
  assert.notEqual(String.fromCharCode(...file.subarray(0, magic.length)), magic);
  assert.equal(String.fromCharCode(...getUncompressed(file).subarray(0, magic.length)), magic);
});
