// Slides are taken out of every row, every other effect and the notes kept, and an empty row is null.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FurFile } from './fur.types.ts';
import { getSlideCount, removeSlides } from './slides.ts';

const VIBRATO = { code: 0x04, value: 0x24 };
const PORTAMENTO = { code: 0x03, value: 0x10 };
const NOTE_SLIDE = { code: 0xe1, value: 0x35 };

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
    orders: [[0]],
    effectColumns: [2],
    channelNames: [''],
  },
  instruments: [],
  wavetables: [],
  patterns: [
    {
      channel: 0,
      index: 0,
      rows: [
        { note: 100, effects: [PORTAMENTO, VIBRATO] },
        { effects: [NOTE_SLIDE] },
        { note: 102, effects: [PORTAMENTO] },
        null,
      ],
    },
  ],
};

test('slides are counted and taken out, the rest kept', () => {
  assert.equal(getSlideCount(FUR), 3);
  const plain = removeSlides(FUR);
  assert.deepEqual(plain.patterns[0]?.rows, [
    { note: 100, effects: [VIBRATO] },
    null,
    { note: 102 },
    null,
  ]);
  assert.equal(getSlideCount(plain), 0);
  assert.equal(getSlideCount(FUR), 3);
});
