// The timeline places blocks in ticks with their trim and repeats, shows bars past the song's end,
// and numbers fewer bars when they are narrow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Clip, ClipParent } from '../../shared/clip.schema.ts';
import type { Song } from '../../shared/song.schema.ts';
import {
  getBarLabelStep,
  getBlockSpans,
  getTicksPerBar,
  getTimelineBars,
  getTrackColor,
  getSongSplitCount,
} from './timeline.ts';

const SONG: Song = {
  id: 's0001',
  title: 'Test',
  created: '',
  updated: '',
  bpm: 120,
  beats: 4,
  tags: [],
  status: 'new',
  prompt: '',
  guides: [],
  structure: null,
  harmony: null,
  promptedFrom: null,
  tracks: [
    {
      id: 't1',
      name: 'Bass',
      volume: 0,
      blocks: [
        { clip: 'c0001', start: 0, trim: null, repeats: 1 },
        { clip: 'c0001', start: 1536, trim: { offset: 384, length: 768 }, repeats: 2 },
      ],
    },
  ],
};
function getClip(id: string, seconds: number, created: string, parent: ClipParent | null): Clip {
  return {
    id,
    created,
    name: { section: null, stem: null },
    bars: null,
    channels: [0],
    parent,
    variationLabel: parent?.relation === 'variation' ? 'a take' : null,
    madeFor: null,
    tags: [],
    status: 'new',
    bpm: 120,
    beats: 4,
    key: null,
    chips: ['NES'],
    seconds,
    furnace: null,
  };
}

// 4 s at 120 bpm: 8 beats, two bars
const CLIP = getClip('c0001', 4, '', null);

test('a whole block is as long as its clip, a trimmed one its trim, times its repeats', () => {
  const [whole, trimmed] = getBlockSpans(SONG, [CLIP]);
  assert.deepEqual(
    [whole?.length, whole?.end, whole?.slice],
    [768, 768, { offset: 0, duration: 4 }],
  );
  assert.deepEqual(
    [trimmed?.length, trimmed?.end, trimmed?.slice],
    [768, 3072, { offset: 2, duration: 4 }],
  );
});

test('the timeline shows the song and four bars after it', () => {
  const spans = getBlockSpans(SONG, [CLIP]);
  assert.equal(getTicksPerBar(SONG), 384);
  assert.equal(getTimelineBars(spans, 384), 12);
});

test('narrow bars are numbered every fourth or eighth', () => {
  assert.deepEqual([40, 15, 6].map(getBarLabelStep), [1, 4, 8]);
});

test('the tracks take the colours in turn', () => {
  assert.deepEqual([0, 7, 8].map(getTrackColor), [
    'var(--track-1)',
    'var(--track-8)',
    'var(--track-1)',
  ]);
});

test('a song of one untrimmed block of a whole clip of several channels can be split', () => {
  const whole: Song = {
    ...SONG,
    tracks: [
      {
        id: 't1',
        name: 'Whole',
        volume: 0,
        blocks: [{ clip: 'c0001', start: 0, trim: null, repeats: 1 }],
      },
    ],
  };
  const four = { ...CLIP, channels: [0, 1, 2, 3] };
  assert.equal(getSongSplitCount(whole, [four]), 4);
  assert.equal(getSongSplitCount(SONG, [four]), 0);
  assert.equal(getSongSplitCount(whole, [{ ...four, channels: [2] }]), 0);
  assert.equal(
    getSongSplitCount(whole, [{ ...four, parent: { clip: 'c9', relation: 'split' } }]),
    0,
  );
});
