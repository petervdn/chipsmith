// A song's blocks become stretches of audio: repeats back to back, trims as offsets, in seconds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Clip } from '../../shared/clip.schema.ts';
import type { Song } from '../../shared/song.schema.ts';
import { TICKS_PER_BEAT } from '../../shared/ticks.ts';
import { getEnd, getFittedStretches, getPieces, getStretches } from './schedule.ts';

test('repeats follow each other and trims become offsets', () => {
  const song: Song = {
    id: 's1',
    title: '',
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
        name: 'A',
        volume: 0,
        blocks: [
          { clip: 'c1', start: 0, trim: null, repeats: 2 },
          {
            clip: 'c1',
            start: TICKS_PER_BEAT * 16,
            trim: { offset: TICKS_PER_BEAT, length: TICKS_PER_BEAT * 2 },
            repeats: 1,
          },
          { clip: 'missing', start: 0, trim: null, repeats: 1 },
        ],
      },
    ],
  };
  const clips: Clip[] = [{ ...SOME_CLIP, id: 'c1', seconds: 4 }];
  const stretches = getStretches(song, clips);
  assert.deepEqual(
    stretches.map(({ start, offset, duration }) => ({ start, offset, duration })),
    [
      { start: 0, offset: 0, duration: 4 },
      { start: 4, offset: 0, duration: 4 },
      { start: 8, offset: 0.5, duration: 1 },
    ],
  );
  assert.equal(getEnd(stretches), 9);
});

const SOME_CLIP: Clip = {
  id: '',
  created: '',
  name: { section: null, stem: null },
  bars: null,
  channels: [0],
  parent: null,
  variationLabel: null,
  madeFor: null,
  tags: [],
  status: 'new',
  bpm: 120,
  beats: 4,
  key: null,
  chips: [],
  seconds: 0,
  furnace: null,
};

test('pieces are the parts of stretches between two seconds, moved', () => {
  const stretches = [
    { clipId: 'c1', trackId: 't1', start: 0, offset: 1, duration: 4 },
    { clipId: 'c2', trackId: 't1', start: 4, offset: 0, duration: 4 },
    { clipId: 'c3', trackId: 't2', start: 9, offset: 0, duration: 2 },
  ];
  assert.deepEqual(getPieces(stretches, 2, 6, 10), [
    { clipId: 'c1', trackId: 't1', at: 12, offset: 3, duration: 2 },
    { clipId: 'c2', trackId: 't1', at: 14, offset: 0, duration: 2 },
  ]);
});

test('fitted stretches end with their audio, and a clip with none plays nothing', () => {
  const stretch = { clipId: 'c1', trackId: 't1', start: 0, offset: 1, duration: 4 };
  const fitted = getFittedStretches([stretch, { ...stretch, clipId: 'c2' }], (clipId) =>
    clipId === 'c1' ? 3 : undefined,
  );
  assert.deepEqual(fitted, [{ ...stretch, duration: 2 }]);
});
