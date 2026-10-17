// A .fur file is cut into a piece per pattern with notes, a pattern played again being the same
// piece; order rows that differ get the next letter; a piece's file holds only its pattern.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFurFile } from '../make/fur-file-builder.ts';
import { getChannelNames, getCut, getPieceFurFile, getSecondsPerRow } from './cut.ts';
import type { Row } from './fur.types.ts';
import { NES_INSTRUMENT, makeInstrument } from './instrument.ts';
import { getNoteValue } from './notes.ts';

function getBar(note: string): (Row | null)[] {
  return Array.from({ length: 16 }, (_row, i) =>
    i % 4 === 0 ? { note: getNoteValue(note), instrument: 0 } : null,
  );
}

const SILENT = Array.from({ length: 16 }, (): Row | null => null);
// bass: D D F D; lead: silent, E, silent, E
const FUR_FILE = buildFurFile({
  title: 'test',
  chips: 'nes',
  bpm: 120,
  beatsPerBar: 4,
  patternLength: 16,
  channels: [
    [...SILENT, ...getBar('E-4'), ...SILENT, ...getBar('E-4')],
    [],
    [...getBar('D-2'), ...getBar('D-2'), ...getBar('F-2'), ...getBar('D-2')],
    [],
    [],
  ],
  instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
});

test('the NES channels are named, and a row of a 120 bpm song in 16ths is 1/8 s', () => {
  assert.deepEqual(getChannelNames(FUR_FILE.song), [
    'Pulse 1',
    'Pulse 2',
    'Triangle',
    'Noise',
    'DPCM',
  ]);
  assert.equal(getSecondsPerRow(FUR_FILE.song), 0.125);
});

test('a piece per pattern with notes, played again where the pattern repeats', () => {
  const { pieces, channels } = getCut(FUR_FILE);
  assert.deepEqual(
    channels.map(({ name, orders }) => [name, orders]),
    [
      ['Pulse 1', [null, 0, null, 0]],
      ['Triangle', [1, 1, 2, 1]],
    ],
  );
  assert.deepEqual(
    pieces.map(({ channel, section, firstOrder }) => [channel, section, firstOrder]),
    [
      [0, 'B', 1],
      [2, 'A', 0],
      [2, 'C', 2],
    ],
  );
});

test("a piece's file has one order row and only its own pattern's notes", () => {
  const { pieces } = getCut(FUR_FILE);
  const piece = pieces[2];
  assert.ok(piece);
  const furFile = getPieceFurFile(FUR_FILE, piece);
  assert.deepEqual(furFile.song.orders, [[0], [0], [0], [0], [0]]);
  const notes = furFile.patterns.map((pattern) => pattern.rows.filter((row) => row?.note).length);
  assert.deepEqual(notes, [0, 0, 4, 0, 0]);
});
