// A .fur file's tempo and meter read as Furnace shows them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FurSong } from '../fur/fur.types.ts';
import { getBeatsPerBar, getBpm, getChipNames } from './fur-file-facts.ts';

const SONG: FurSong = {
  name: '',
  author: '',
  systemName: 'NES',
  comment: '',
  chips: [0x06, 0xb4],
  chipVolumes: [1, 1],
  chipFlags: ['', null],
  channelCount: 10,
  tickRate: 60,
  speeds: [6],
  virtualTempo: { numerator: 152, denominator: 150 },
  patternLength: 32,
  highlights: { first: 4, second: 16 },
  orders: [],
  effectColumns: [],
};

test('tempo, meter and chips read as Furnace shows them', () => {
  assert.equal(getBpm(SONG), 152);
  assert.equal(getBeatsPerBar(SONG), 4);
  assert.equal(getBeatsPerBar({ ...SONG, highlights: { first: 4, second: 12 } }), 3);
  assert.deepEqual(getChipNames(SONG), ['NES', 'SCC+']);
});
