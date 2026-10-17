// A muted track is not heard, and while any track is soloed only the soloed ones are.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_MIX, getUnheardTrackIds, isHeard } from './track-mix.ts';

test('muted is never heard; soloed tracks are the only ones heard', () => {
  assert.equal(isHeard('t1', EMPTY_MIX), true);
  assert.equal(isHeard('t1', { muted: ['t1'], soloed: [] }), false);
  assert.equal(isHeard('t2', { muted: [], soloed: ['t1'] }), false);
  assert.equal(isHeard('t1', { muted: ['t1'], soloed: ['t1'] }), false);
});

test('the tracks not heard, by id', () => {
  const tracks = ['t1', 't2', 't3'].map((id) => ({ id, name: id, blocks: [] }));
  assert.deepEqual(getUnheardTrackIds(tracks, { muted: ['t3'], soloed: [] }), ['t3']);
  assert.deepEqual(getUnheardTrackIds(tracks, { muted: [], soloed: ['t2'] }), ['t1', 't3']);
});
