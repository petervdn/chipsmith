// The edits leave the tracks they were given as they were, keep a track's blocks in order of their
// start, and say where the edited block is afterwards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Track } from '../../shared/song.types.ts';
import {
  addBlock,
  addTrack,
  duplicateBlock,
  getClipPlaces,
  moveBlock,
  removeTrack,
  renameTrack,
  setBlockClip,
  setRepeats,
  setTrackVolume,
  trimBlock,
} from './song-edits.ts';

const TRACKS: Track[] = [
  {
    id: 't1',
    name: 'Bass',
    volume: 0,
    blocks: [
      { clip: 'c1', start: 0, trim: null, repeats: 1 },
      { clip: 'c2', start: 768, trim: null, repeats: 1 },
    ],
  },
  { id: 't2', name: 'Lead', volume: 0, blocks: [] },
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
  assert.deepEqual(added[2], { id: 't3', name: 'Track 3', volume: 0, blocks: [] });
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

test("a track's level is set, the others and the old tracks untouched", () => {
  const tracks = setTrackVolume(TRACKS, 't2', -6);
  assert.deepEqual(
    tracks.map((track) => track.volume),
    [0, -6],
  );
  assert.equal(TRACKS[1]?.volume, 0);
  assert.equal(setTrackVolume(TRACKS, 't1', 0), TRACKS);
});

test('another clip in a block keeps its start, repeats and trim', () => {
  const trimmed: Track[] = [
    {
      id: 't1',
      name: 'Bass',
      volume: 0,
      blocks: [{ clip: 'c1', start: 96, trim: { offset: 384, length: 384 }, repeats: 2 }],
    },
  ];
  const { tracks, place } = setBlockClip(trimmed, { trackId: 't1', index: 0 }, 'c9', 1536);
  assert.deepEqual(tracks[0]?.blocks[0], {
    clip: 'c9',
    start: 96,
    trim: { offset: 384, length: 384 },
    repeats: 2,
  });
  assert.deepEqual(place, { trackId: 't1', index: 0 });
  assert.equal(trimmed[0]?.blocks[0]?.clip, 'c1');
});

test('a trim past the end of a shorter clip is cut to it, or dropped', () => {
  const trimmed: Track[] = [
    {
      id: 't1',
      name: 'Bass',
      volume: 0,
      blocks: [{ clip: 'c1', start: 0, trim: { offset: 384, length: 768 }, repeats: 1 }],
    },
  ];
  const place = { trackId: 't1', index: 0 };
  assert.deepEqual(setBlockClip(trimmed, place, 'c9', 768).tracks[0]?.blocks[0]?.trim, {
    offset: 384,
    length: 384,
  });
  assert.equal(setBlockClip(trimmed, place, 'c9', 384).tracks[0]?.blocks[0]?.trim, null);
  assert.deepEqual(setBlockClip(trimmed, place, 'c9', null).tracks[0]?.blocks[0]?.trim, {
    offset: 384,
    length: 768,
  });
});

test('the places of the blocks that play a clip', () => {
  const tracks: Track[] = [
    ...TRACKS.slice(0, 1),
    {
      id: 't2',
      name: 'Lead',
      volume: 0,
      blocks: [{ clip: 'c1', start: 0, trim: null, repeats: 1 }],
    },
  ];
  assert.deepEqual(getClipPlaces(tracks, 'c1'), [
    { trackId: 't1', index: 0 },
    { trackId: 't2', index: 0 },
  ]);
});
