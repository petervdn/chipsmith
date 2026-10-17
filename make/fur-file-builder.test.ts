// A draft becomes a .fur file whose tempo and meter read back as written, with repeated patterns reused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Row } from '../fur/fur.types.ts';
import { makeInstrument, NES_INSTRUMENT } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { readFurFile } from '../fur/read.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { buildFurFile } from './fur-file-builder.ts';
import { getBeatsPerBar, getBpm } from './fur-file-facts.ts';

function getBar(note: string): (Row | null)[] {
  return Array.from({ length: 16 }, (_row, i) =>
    i % 4 === 0 ? { note: getNoteValue(note), instrument: 0 } : null,
  );
}

test('a draft becomes a .fur file with its tempo and meter, repeats reused', () => {
  const bass = [...getBar('D-2'), ...getBar('D-2'), ...getBar('F-2'), ...getBar('D-2')];
  const silent: (Row | null)[] = [];
  const furFile = buildFurFile({
    title: 'test',
    chips: ['nes'],
    bpm: 132,
    beatsPerBar: 4,
    patternLength: 16,
    channels: [silent, silent, bass, silent, silent],
    instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
  });
  assert.equal(getBpm(furFile.song), 132);
  assert.equal(getBeatsPerBar(furFile.song), 4);
  assert.deepEqual(furFile.song.orders[2], [0, 0, 1, 0]);
  assert.deepEqual(furFile.song.orders[0], [0, 0, 0, 0]);
  assert.deepEqual(readFurFile(getFurFileBytes(furFile)).song, furFile.song);
});

test('a draft with the wrong number of channels is an error', () => {
  assert.throws(() =>
    buildFurFile({
      title: 't',
      chips: ['nes', 'scc'],
      bpm: 120,
      beatsPerBar: 4,
      channels: [[]],
      instruments: [],
    }),
  );
});

test('the chips come NES first whatever their order, and a song can be SCC only', () => {
  const draft = { title: 't', bpm: 120, beatsPerBar: 4, instruments: [] };
  const both = buildFurFile({
    ...draft,
    chips: ['scc', 'nes'],
    channels: Array.from({ length: 10 }, () => []),
  });
  assert.equal(both.song.systemName, 'NES + SCC+');
  assert.deepEqual(both.song.chips, [0x06, 0xb4]);
  const scc = buildFurFile({
    ...draft,
    chips: ['scc'],
    channels: Array.from({ length: 5 }, () => []),
  });
  assert.equal(scc.song.systemName, 'SCC+');
  assert.deepEqual(scc.song.chipFlags, [null]);
  assert.throws(() => buildFurFile({ ...draft, chips: [], channels: [] }));
});

test('a chip can come twice, its channels after the first', () => {
  const twice = buildFurFile({
    title: 't',
    bpm: 120,
    beatsPerBar: 4,
    instruments: [],
    chips: ['sid', 'scc', 'scc'],
    channels: Array.from({ length: 13 }, () => []),
  });
  assert.equal(twice.song.systemName, 'SCC+ + SCC+ + SID');
  assert.deepEqual(twice.song.chips, [0xb4, 0xb4, 0x47]);
  assert.equal(twice.song.channelCount, 13);
  assert.deepEqual(twice.song.chipFlags, [null, null, 'clockSel=1\n']);
});
