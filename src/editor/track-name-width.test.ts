// The track names are dragged wider or narrower within their bounds, to whole pixels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTrackNameWidth } from './track-name-width.ts';

test('the track names keep within their bounds, to whole pixels', () => {
  assert.equal(getTrackNameWidth(150.4), 150);
  assert.equal(getTrackNameWidth(10), 64);
  assert.equal(getTrackNameWidth(1000), 360);
});
