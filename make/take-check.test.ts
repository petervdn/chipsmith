// A take fits its clip with the same chips and tempo and notes to play; another length is noted.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ClipFacts } from '../shared/clip.schema.ts';
import { checkTake } from './take-check.ts';

const CLIP: ClipFacts = { bpm: 150, beats: 4, chips: ['NES'], channels: [0, 1, 2], seconds: 32 };

test('a take with the clip’s chips, tempo and length fits', () => {
  assert.deepEqual(checkTake({ ...CLIP, channels: [1] }, CLIP), { problems: [], notes: [] });
});

test('other chips, another tempo or no notes do not fit', () => {
  const { problems } = checkTake({ ...CLIP, chips: ['NES', 'SCC'], bpm: 140, channels: [] }, CLIP);
  assert.equal(problems.length, 3);
  assert.match(problems[1] ?? '', /140 bpm, the clip at 150/);
});

test('another length is only noted', () => {
  const { problems, notes } = checkTake({ ...CLIP, seconds: 64 }, CLIP);
  assert.deepEqual(problems, []);
  assert.match(notes[0] ?? '', /64\.0 s, the clip 32\.0 s/);
});
