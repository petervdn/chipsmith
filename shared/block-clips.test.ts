// Replacing the clip blocks play changes every block that plays it and nothing else.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Track } from './song.schema.ts';
import { replaceBlockClip } from './block-clips.ts';

const TRACKS: Track[] = [
  {
    id: 't1',
    name: 'Bass',
    volume: 0,
    isMuted: false,
    blocks: [
      { clip: 'c0002', start: 0, trim: { offset: 48, length: 96 }, repeats: 2 },
      { clip: 'c0003', start: 192, trim: null, repeats: 1 },
    ],
  },
  {
    id: 't2',
    name: 'Lead',
    volume: -3,
    isMuted: false,
    blocks: [{ clip: 'c0002', start: 0, trim: null, repeats: 1 }],
  },
];

test('every block that plays the clip plays the other one, its place kept', () => {
  const replaced = replaceBlockClip(TRACKS, 'c0002', 'c0001');
  assert.deepEqual(replaced[0]?.blocks[0], {
    clip: 'c0001',
    start: 0,
    trim: { offset: 48, length: 96 },
    repeats: 2,
  });
  assert.equal(replaced[0]?.blocks[1]?.clip, 'c0003');
  assert.equal(replaced[1]?.blocks[0]?.clip, 'c0001');
});

test('tracks that do not play the clip are given back as they are', () => {
  assert.equal(replaceBlockClip(TRACKS, 'c0009', 'c0001'), TRACKS);
});
