// The edits leave the tracks they were given as they were, keep a track's blocks in order of their
// start, and say where the edited block is afterwards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Track } from '../../shared/song.types.ts';
import {
  addBlock,
  addTrack,
  duplicateBlock,
  moveBlock,
  removeTrack,
  renameTrack,
  setRepeats,
  trimBlock,
} from './song-edits.ts';

const TRACKS: Track[] = [
  {
    id: 't1',
    name: 'Bass',
    blocks: [
      { clip: 'c1', start: 0, trim: null, repeats: 1 },
      { clip: 'c2', start: 768, trim: null, repeats: 1 },
    ],
  },
  { id: 't2', name: 'Lead', blocks: [] },
];

test('a block moved to another track goes in order of its start, the old tracks untouched', () => {
  const { tracks, place } = moveBlock(
    TRACKS,
    { trackId: 't1', index: 1 },
    {
      start: 384,
      trackId: 't2',
    },
  );
  assert.deepEqual(place, { trackId: 't2', index: 0 });
  assert.equal(tracks[0]?.blocks.length, 1);
  assert.equal(tracks[1]?.blocks[0]?.start, 384);
  assert.equal(TRACKS[0]?.blocks.length, 2);
});

test('a block moved past the next one comes after it', () => {
  const { place } = moveBlock(TRACKS, { trackId: 't1', index: 0 }, { start: 1000, trackId: 't1' });
  assert.deepEqual(place, { trackId: 't1', index: 1 });
});

test('a trim of the whole clip is no trim', () => {
  const place = { trackId: 't1', index: 0 };
  const trimmed = trimBlock(TRACKS, place, { start: 0, trim: { offset: 96, length: 288 } }, 768);
  assert.deepEqual(trimmed.tracks[0]?.blocks[0]?.trim, { offset: 96, length: 288 });
  const whole = trimBlock(TRACKS, place, { start: 0, trim: { offset: 0, length: 768 } }, 768);
  assert.equal(whole.tracks[0]?.blocks[0]?.trim, null);
});

test('repeats stay from 1 to 64', () => {
  const place = { trackId: 't1', index: 0 };
  assert.equal(setRepeats(TRACKS, place, 0).tracks[0]?.blocks[0]?.repeats, 1);
  assert.equal(setRepeats(TRACKS, place, 99).tracks[0]?.blocks[0]?.repeats, 64);
});

test('a copy goes right after the block and its repeats', () => {
  const repeated = setRepeats(TRACKS, { trackId: 't1', index: 1 }, 2).tracks;
  const { tracks, place } = duplicateBlock(repeated, { trackId: 't1', index: 1 }, 768);
  assert.deepEqual(place, { trackId: 't1', index: 2 });
  assert.equal(tracks[0]?.blocks[2]?.start, 2304);
});

test('a new track gets the next id; a track is renamed and removed', () => {
  const added = addTrack(TRACKS);
  assert.deepEqual(added[2], { id: 't3', name: 'Track 3', blocks: [] });
  assert.equal(renameTrack(added, 't3', '  Drums ')[2]?.name, 'Drums');
  assert.equal(renameTrack(added, 't3', '  ')[2]?.name, 'Track 3');
  assert.deepEqual(
    removeTrack(added, 't1').map((track) => track.id),
    ['t2', 't3'],
  );
});

test('a block added goes in order of its start, a whole clip played once', () => {
  const { tracks, place } = addBlock(TRACKS, { clipId: 'c3', start: 384, trackId: 't1' });
  assert.deepEqual(place, { trackId: 't1', index: 1 });
  assert.deepEqual(tracks[0]?.blocks[1], { clip: 'c3', start: 384, trim: null, repeats: 1 });
  assert.equal(TRACKS[0]?.blocks.length, 2);
  assert.deepEqual(addBlock(TRACKS, { clipId: 'c3', start: 0, trackId: 'none' }).place, null);
});
