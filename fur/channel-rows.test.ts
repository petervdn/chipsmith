// A channel read out as one run of rows and written back: a pattern played twice becomes two, the
// effects stay on their rows, and the other channels are untouched.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FurFile } from './fur.types.ts';
import { getChannelRows, getRowCount, setChannelRows } from './channel-rows.ts';

const SPEED = { code: 0x0f, value: 6 };

const FUR: FurFile = {
  song: {
    name: '',
    author: '',
    systemName: 'NES',
    comment: '',
    chips: [0x06],
    chipVolumes: [64],
    chipFlags: [null],
    channelCount: 5,
    tickRate: 60,
    speeds: [6],
    virtualTempo: { numerator: 150, denominator: 150 },
    patternLength: 4,
    highlights: { first: 4, second: 16 },
    orders: [
      [0, 0],
      [0, 1],
    ],
    effectColumns: [1, 1],
    channelNames: ['', ''],
  },
  instruments: [],
  wavetables: [],
  patterns: [
    {
      channel: 0,
      index: 0,
      rows: [{ note: 100, instrument: 1, effects: [SPEED] }, null, { note: 180 }, { volume: 8 }],
    },
    { channel: 1, index: 0, rows: [{ note: 90 }, null, null, null] },
    { channel: 1, index: 1, rows: [null, null, null, null] },
  ],
};

test('a channel is read as its run of rows, a pattern at two orders twice', () => {
  assert.equal(getRowCount(FUR, 0), 8);
  assert.deepEqual(getChannelRows(FUR, 0), [
    { row: 0, note: 100, instrument: 1, volume: null },
    { row: 2, note: 180, instrument: null, volume: null },
    { row: 3, note: null, instrument: null, volume: 8 },
    { row: 4, note: 100, instrument: 1, volume: null },
    { row: 6, note: 180, instrument: null, volume: null },
    { row: 7, note: null, instrument: null, volume: 8 },
  ]);
});

test('written back, the edit lands at its order only, effects stay, other channels too', () => {
  const rows = getChannelRows(FUR, 0).map((row) => (row.row === 4 ? { ...row, note: 103 } : row));
  const moved = rows
    .filter((row) => row.row !== 0)
    .concat([{ row: 1, note: 101, instrument: 1, volume: null }]);
  const written = setChannelRows(FUR, 0, moved);
  assert.deepEqual(written.song.orders[0], [0, 1]);
  assert.deepEqual(written.song.orders[1], [0, 1]);
  assert.deepEqual(
    getChannelRows(written, 0).map(({ row, note }) => [row, note]),
    [
      [1, 101],
      [2, 180],
      [3, null],
      [4, 103],
      [6, 180],
      [7, null],
    ],
  );
  const first = written.patterns.find((pattern) => pattern.channel === 0 && pattern.index === 0);
  assert.deepEqual(first?.rows[0], { effects: [SPEED] });
  assert.deepEqual(
    written.patterns.filter((pattern) => pattern.channel === 1),
    FUR.patterns.filter((pattern) => pattern.channel === 1),
  );
});

test('a row past the run is an error', () => {
  assert.throws(
    () => setChannelRows(FUR, 0, [{ row: 8, note: 100, instrument: null, volume: null }]),
    /row 8/,
  );
});
