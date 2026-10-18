// Tests for a clip's lineage: whether a variation is among the clips it was made from.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Clip, ClipParent } from './clip.types.ts';
import { hasVariationInLineage } from './clip-lineage.ts';

function getClip(id: string, parent: ClipParent | null): Clip {
  return {
    id,
    created: '2026-10-18T00:00:00.000Z',
    name: { section: null, stem: null },
    bars: null,
    parent,
    variationLabel: parent?.relation === 'variation' ? 'busier' : null,
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

const whole = getClip('c0001', null);
const split = getClip('c0002', { clip: 'c0001', relation: 'split' });
const take = getClip('c0003', { clip: 'c0002', relation: 'variation' });
const splitOfTake = getClip('c0004', { clip: 'c0003', relation: 'split' });
const clips = new Map([whole, split, take, splitOfTake].map((clip) => [clip.id, clip]));
function find(clipId: string): Clip | undefined {
  return clips.get(clipId);
}

test('a whole clip and a cut of it have no variation in their lineage', () => {
  assert.equal(hasVariationInLineage(whole, find), false);
  assert.equal(hasVariationInLineage(split, find), false);
});

test('a variation, and a cut of one, have', () => {
  assert.equal(hasVariationInLineage(take, find), true);
  assert.equal(hasVariationInLineage(splitOfTake, find), true);
});

test('a parent that cannot be found, or a loop, ends the lineage', () => {
  const orphan = getClip('c0005', { clip: 'c9999', relation: 'split' });
  assert.equal(hasVariationInLineage(orphan, find), false);
  const looped = getClip('c0006', { clip: 'c0006', relation: 'split' });
  assert.equal(
    hasVariationInLineage(looped, () => looped),
    false,
  );
});
