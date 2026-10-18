// A clip's versions are its line of variations, oldest first, whichever version is asked about; a
// cut out of it is not one of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Clip, ClipParent } from '../../shared/clip.schema.ts';
import { getVersions } from './versions.ts';

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

const CLIPS = [
  getClip('c1', 10, '2026-10-01', null),
  getClip('c2', 10, '2026-10-02', { clip: 'c1', relation: 'variation' }),
  getClip('c3', 10, '2026-10-03', { clip: 'c2', relation: 'variation' }),
  getClip('c4', 10, '2026-10-04', { clip: 'c1', relation: 'split' }),
];

test('the versions of any clip in a line are the whole line, oldest first', () => {
  for (const id of ['c1', 'c2', 'c3']) {
    assert.deepEqual(
      getVersions(id, CLIPS).map((clip) => clip.id),
      ['c1', 'c2', 'c3'],
    );
  }
});

test('a cut is not a version, and has its own line', () => {
  assert.deepEqual(
    getVersions('c4', CLIPS).map((clip) => clip.id),
    ['c4'],
  );
});
