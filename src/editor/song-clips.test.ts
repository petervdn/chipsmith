// The song's clips are listed in the order it first plays them, with their blocks counted; one no
// block plays comes last. A clip's first block is its earliest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Clip } from '../../shared/clip.schema.ts';
import type { Track } from '../../shared/song.schema.ts';
import { getEditorClips, getSongClips, getUsageText } from './song-clips.ts';

/**
 * Returns a clip with only what the list reads filled in.
 *
 * @param id - The clip's id.
 * @returns The clip.
 */
function makeClip(id: string): Clip {
  return {
    id,
    created: '2026-10-17T00:00:00.000Z',
    name: { section: null, stem: null },
    bars: null,
    parent: null,
    variationLabel: null,
    madeFor: null,
    tags: [],
    status: 'new',
    key: null,
    furnace: null,
    bpm: 120,
    beats: 4,
    chips: ['NES'],
    channels: [0],
    seconds: 8,
  };
}

const TRACKS: Track[] = [
  {
    id: 't1',
    name: 'Bass',
    volume: 0,
    blocks: [
      { clip: 'c2', start: 768, trim: null, repeats: 1 },
      { clip: 'c2', start: 1536, trim: null, repeats: 1 },
    ],
  },
  { id: 't2', name: 'Lead', volume: 0, blocks: [{ clip: 'c3', start: 0, trim: null, repeats: 2 }] },
];

test('in the order the song first plays them, with their blocks counted, unplayed last', () => {
  const listed = getSongClips(TRACKS, [makeClip('c1'), makeClip('c2'), makeClip('c3')], []);
  assert.deepEqual(
    listed.map(({ clip, blockCount }) => [clip.id, blockCount]),
    [
      ['c3', 1],
      ['c2', 2],
      ['c1', 0],
    ],
  );
});

/**
 * Returns a take of a clip, made a moment after it.
 *
 * @param id - The take's id.
 * @param parentId - The clip it was made from.
 * @param minute - When it was made, in minutes after the clips.
 * @returns The take.
 */
function makeTake(id: string, parentId: string, minute: number): Clip {
  return {
    ...makeClip(id),
    created: `2026-10-17T00:${String(minute).padStart(2, '0')}:00.000Z`,
    parent: { clip: parentId, relation: 'variation' },
    variationLabel: `take ${id}`,
  };
}

test('a clip’s takes are under it, a take the song plays and one it does not alike', () => {
  const played = makeTake('c3', 'c2', 1);
  const pool = [makeClip('c1'), makeClip('c2'), played, makeTake('c4', 'c2', 2)];
  const tracks: Track[] = [
    {
      id: 't1',
      name: 'Bass',
      volume: 0,
      blocks: [{ clip: 'c3', start: 0, trim: null, repeats: 1 }],
    },
    {
      id: 't2',
      name: 'Lead',
      volume: 0,
      blocks: [{ clip: 'c1', start: 384, trim: null, repeats: 1 }],
    },
  ];
  const listed = getSongClips(tracks, [makeClip('c1'), makeClip('c2'), played], pool);
  assert.deepEqual(
    listed.map(({ clip, blockCount, takes }) => [
      clip.id,
      blockCount,
      takes.map((take) => [take.clip.id, take.blockCount]),
    ]),
    [
      [
        'c2',
        0,
        [
          ['c3', 1],
          ['c4', 0],
        ],
      ],
      ['c1', 1, []],
    ],
  );
});

test('the editor knows the song’s clips and the pool’s the draft plays besides', () => {
  const known = getEditorClips(
    TRACKS,
    [makeClip('c2')],
    [makeClip('c2'), makeClip('c3'), makeClip('c9')],
  );
  assert.deepEqual(
    known.map((clip) => clip.id),
    ['c2', 'c3'],
  );
});

test('how often a clip is used, in words', () => {
  assert.deepEqual([0, 1, 3].map(getUsageText), ['unused', 'used 1x', 'used 3x']);
});
