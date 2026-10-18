// A running job of takes shows a line per take not made yet, under the clip the column lists it with,
// also for a take of a take; jobs of other songs, and takes made, show nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Clip } from '../../shared/clip.schema.ts';
import type { Job } from '../../shared/job.schema.ts';
import { getPendingTakes } from './pending-takes.ts';
import type { SongClip } from './song-clips.ts';

const JOB: Job = {
  id: 'j0001',
  prompt: 'busier',
  guides: [],
  tokens: null,
  nowTokens: null,
  songCount: 3,
  takesOf: { clip: 'c1', song: 's1' },
  structure: null,
  harmony: null,
  created: '2026-10-18T10:00:00Z',
  phase: 'rendering',
  composeStep: null,
  phaseStarted: '2026-10-18T10:00:00Z',
  finished: null,
  notes: [],
  now: null,
  songs: [
    { title: 'walking bass', state: 'done', songId: 's1' },
    { title: 'octave jumps', state: 'rendering', songId: null },
  ],
  summary: null,
  error: null,
  promptedFrom: null,
  claudePid: null,
  removed: null,
};

/**
 * Returns a clip with only its id that matters.
 *
 * @param id - The clip's id.
 * @returns The clip.
 */
function makeClip(id: string): Clip {
  return {
    id,
    created: '2026-10-18T00:00:00.000Z',
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

const SONG_CLIPS: SongClip[] = [
  {
    clip: makeClip('c1'),
    blockCount: 1,
    takes: [{ clip: makeClip('c5'), blockCount: 0, depth: 1 }],
  },
];

test('a line per take not made yet, under its clip', () => {
  assert.deepEqual(getPendingTakes([JOB], 's1', SONG_CLIPS), [
    { key: 'j0001-1', clipId: 'c1', depth: 1, label: 'octave jumps', stateText: 'rendering…' },
    { key: 'j0001-2', clipId: 'c1', depth: 1, label: 'Take 3', stateText: 'being written…' },
  ]);
});

test("a take of a take is listed under the clip it was made from; another song's job is not", () => {
  const ofTake: Job = { ...JOB, songCount: 1, songs: [], takesOf: { clip: 'c5', song: 's1' } };
  const elsewhere: Job = { ...JOB, takesOf: { clip: 'c1', song: 's2' } };
  assert.deepEqual(
    getPendingTakes([ofTake, elsewhere], 's1', SONG_CLIPS).map(({ clipId, depth }) => [
      clipId,
      depth,
    ]),
    [['c1', 2]],
  );
});
