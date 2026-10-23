// Taking time out of a song: blocks before it stay, blocks after it move up, a block over it is cut
// into what is before and what is after, its whole repeats kept as repeats.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Track } from '../../shared/song.schema.ts';
import { removeTicks } from './bar-cut.ts';

const BAR = 100;

/**
 * Returns a track of blocks.
 *
 * @param blocks - The blocks.
 * @returns The track.
 */
function getTrack(blocks: Track['blocks']): Track {
  return { id: 't1', name: 'Bass', volume: 0, isMuted: false, blocks };
}

test('blocks before stay and blocks after move up', () => {
  const tracks = [
    getTrack([
      { clip: 'a', start: 0, trim: null, repeats: 1 },
      { clip: 'b', start: 5 * BAR, trim: null, repeats: 1 },
    ]),
  ];
  const cut = removeTicks(tracks, { from: 2 * BAR, to: 4 * BAR }, () => 2 * BAR);
  assert.deepEqual(cut[0]?.blocks, [
    { clip: 'a', start: 0, trim: null, repeats: 1 },
    { clip: 'b', start: 3 * BAR, trim: null, repeats: 1 },
  ]);
});

test('a block over the cut keeps what is before and after, the rest closing up', () => {
  const tracks = [getTrack([{ clip: 'a', start: 0, trim: null, repeats: 1 }])];
  const cut = removeTicks(tracks, { from: 2 * BAR, to: 5 * BAR }, () => 8 * BAR);
  assert.deepEqual(cut[0]?.blocks, [
    { clip: 'a', start: 0, trim: { offset: 0, length: 2 * BAR }, repeats: 1 },
    { clip: 'a', start: 2 * BAR, trim: { offset: 5 * BAR, length: 3 * BAR }, repeats: 1 },
  ]);
});

test("a repeated block keeps its whole repeats, the cut one's sides trimmed", () => {
  const tracks = [getTrack([{ clip: 'a', start: 0, trim: null, repeats: 4 }])];
  const cut = removeTicks(tracks, { from: 3 * BAR, to: 5 * BAR }, () => 2 * BAR);
  assert.deepEqual(cut[0]?.blocks, [
    { clip: 'a', start: 0, trim: null, repeats: 1 },
    { clip: 'a', start: 2 * BAR, trim: { offset: 0, length: BAR }, repeats: 1 },
    { clip: 'a', start: 3 * BAR, trim: { offset: BAR, length: BAR }, repeats: 1 },
    { clip: 'a', start: 4 * BAR, trim: null, repeats: 1 },
  ]);
});

test('a block inside the cut goes, and a cut of nothing changes nothing', () => {
  const tracks = [getTrack([{ clip: 'a', start: 2 * BAR, trim: null, repeats: 1 }])];
  assert.deepEqual(removeTicks(tracks, { from: BAR, to: 4 * BAR }, () => BAR)[0]?.blocks, []);
  assert.equal(
    removeTicks(tracks, { from: BAR, to: BAR }, () => BAR),
    tracks,
  );
});
