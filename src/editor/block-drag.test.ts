// A dragged block snaps to the grid and moves between tracks; its edges trim it within its clip and
// never below a step of the grid. A clip dropped on a track is a new block, snapped the same way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Track } from '../../shared/song.types.ts';
import type { Drag } from './block-drag.ts';
import { getDraggedTracks, getDroppedTracks } from './block-drag.ts';
import { GRID_STEPS } from './grid.ts';

const BAR = GRID_STEPS[0];
const TRACKS: Track[] = [
  {
    id: 't1',
    name: 'Bass',
    volume: 0,
    blocks: [{ clip: 'c1', start: 384, trim: null, repeats: 1 }],
  },
  { id: 't2', name: 'Lead', volume: 0, blocks: [] },
];
const PLACE = { trackId: 't1', index: 0 };

function drag(change: Partial<Drag>): Drag {
  return { mode: 'move', place: PLACE, ticks: 0, rows: 0, isFree: false, ...change };
}

test('a block moved snaps to the bar and goes to the track it is dragged to', () => {
  assert.ok(BAR);
  const grid = { step: BAR, ticksPerBar: 384 };
  const { tracks, place } = getDraggedTracks(TRACKS, drag({ ticks: 250, rows: 1 }), grid, 768);
  assert.deepEqual(place, { trackId: 't2', index: 0 });
  assert.equal(tracks[1]?.blocks[0]?.start, 768);
  const free = getDraggedTracks(TRACKS, drag({ ticks: 250, isFree: true }), grid, 768);
  assert.equal(free.tracks[0]?.blocks[0]?.start, 634);
});

test('the end is trimmed to the grid, never past the clip nor shorter than a step', () => {
  assert.ok(BAR);
  const grid = { step: BAR, ticksPerBar: 384 };
  const shorter = getDraggedTracks(TRACKS, drag({ mode: 'trim-end', ticks: -400 }), grid, 768);
  assert.deepEqual(shorter.tracks[0]?.blocks[0]?.trim, { offset: 0, length: 384 });
  const least = getDraggedTracks(TRACKS, drag({ mode: 'trim-end', ticks: -2000 }), grid, 768);
  assert.deepEqual(least.tracks[0]?.blocks[0]?.trim, { offset: 0, length: 384 });
  const longer = getDraggedTracks(TRACKS, drag({ mode: 'trim-end', ticks: 900 }), grid, 768);
  assert.equal(longer.tracks[0]?.blocks[0]?.trim, null);
});

test('the start is trimmed later into the clip, and not before the clip starts', () => {
  assert.ok(BAR);
  const grid = { step: BAR, ticksPerBar: 384 };
  const later = getDraggedTracks(TRACKS, drag({ mode: 'trim-start', ticks: 384 }), grid, 768);
  assert.deepEqual(
    [later.tracks[0]?.blocks[0]?.start, later.tracks[0]?.blocks[0]?.trim],
    [768, { offset: 384, length: 384 }],
  );
  const before = getDraggedTracks(TRACKS, drag({ mode: 'trim-start', ticks: -384 }), grid, 768);
  assert.deepEqual(
    [before.tracks[0]?.blocks[0]?.start, before.tracks[0]?.blocks[0]?.trim],
    [384, null],
  );
});

test('a clip dropped on a track is a new block there, snapped to the bar', () => {
  assert.ok(BAR);
  const grid = { step: BAR, ticksPerBar: 384 };
  const drop = { clipId: 'c2', trackId: 't2', ticks: 700, isFree: false };
  const { tracks, place } = getDroppedTracks(TRACKS, drop, grid);
  assert.deepEqual(place, { trackId: 't2', index: 0 });
  assert.deepEqual(tracks[1]?.blocks[0], { clip: 'c2', start: 768, trim: null, repeats: 1 });
  const free = getDroppedTracks(TRACKS, { ...drop, ticks: -20, isFree: true }, grid);
  assert.equal(free.tracks[1]?.blocks[0]?.start, 0);
});
