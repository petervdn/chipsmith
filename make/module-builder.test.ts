// A draft becomes a module whose tempo and meter read back as written, with repeated patterns reused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Row } from '../fur/fur.types.ts';
import { makeInstrument, NES_INSTRUMENT } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { readModule } from '../fur/read.ts';
import { getFurFile } from '../fur/write.ts';
import { buildModule } from './module-builder.ts';
import { getBeatsPerBar, getBpm } from './module-facts.ts';

function getBar(note: string): (Row | null)[] {
  return Array.from({ length: 16 }, (_row, i) =>
    i % 4 === 0 ? { note: getNoteValue(note), instrument: 0 } : null,
  );
}

test('a draft becomes a module with its tempo and meter, repeats reused', () => {
  const bass = [...getBar('D-2'), ...getBar('D-2'), ...getBar('F-2'), ...getBar('D-2')];
  const silent: (Row | null)[] = [];
  const module = buildModule({
    title: 'test',
    chips: 'nes',
    bpm: 132,
    beatsPerBar: 4,
    patternLength: 16,
    channels: [silent, silent, bass, silent, silent],
    instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
  });
  assert.equal(getBpm(module.song), 132);
  assert.equal(getBeatsPerBar(module.song), 4);
  assert.deepEqual(module.song.orders[2], [0, 0, 1, 0]);
  assert.deepEqual(module.song.orders[0], [0, 0, 0, 0]);
  assert.deepEqual(readModule(getFurFile(module)).song, module.song);
});

test('a draft with the wrong number of channels is an error', () => {
  assert.throws(() =>
    buildModule({
      title: 't',
      chips: 'nes+scc',
      bpm: 120,
      beatsPerBar: 4,
      channels: [[]],
      instruments: [],
    }),
  );
});
