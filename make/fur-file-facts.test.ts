// A .fur file's tempo and meter read as Furnace shows them, and its length from its rows and speed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FurSong } from '../fur/fur.types.ts';
import { getBeatsPerBar, getBpm, getChipNames, getFurSeconds } from './fur-file-facts.ts';

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

test('the length is the rows of every order at the speed, sped by the virtual tempo', () => {
  const song = { ...SONG, orders: [[0, 1, 2]], virtualTempo: { numerator: 150, denominator: 150 } };
  assert.equal(getFurSeconds(song), 9.6);
  assert.equal(Math.round(getFurSeconds({ ...song, speeds: [5, 7] }) * 100), 960);
  assert.equal(
    Math.round(
      getFurSeconds({ ...song, virtualTempo: { numerator: 300, denominator: 150 } }) * 100,
    ),
    480,
  );
});
