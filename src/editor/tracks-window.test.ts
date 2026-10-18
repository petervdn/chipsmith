// The tracks shrink to one row as the page scrolls past them, the room they leave kept under them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTracksWindow } from './tracks-window.ts';

test('before the page scrolls past them, all the tracks show', () => {
  assert.deepEqual(
    getTracksWindow({ contentHeight: 400, rowHeight: 79, scrolledPast: -50, previousHeight: null }),
    {
      height: 400,
      roomBelow: 0,
      scrollTop: 0,
    },
  );
});

test('while the page scrolls past them, they shrink and scroll up inside as much', () => {
  assert.deepEqual(
    getTracksWindow({ contentHeight: 400, rowHeight: 79, scrolledPast: 100, previousHeight: 400 }),
    {
      height: 300,
      roomBelow: 100,
      scrollTop: 100,
    },
  );
});

test('a scroll that jumps past the shrinking leaves the last row in view', () => {
  assert.deepEqual(
    getTracksWindow({ contentHeight: 400, rowHeight: 79, scrolledPast: 900, previousHeight: 300 }),
    {
      height: 79,
      roomBelow: 321,
      scrollTop: 321,
    },
  );
});

test('once one row is left they shrink no more and stay where they were put', () => {
  assert.deepEqual(
    getTracksWindow({ contentHeight: 400, rowHeight: 79, scrolledPast: 900, previousHeight: 79 }),
    {
      height: 79,
      roomBelow: 321,
      scrollTop: null,
    },
  );
});

test('a song of one track keeps its one row', () => {
  assert.deepEqual(
    getTracksWindow({ contentHeight: 79, rowHeight: 79, scrolledPast: 200, previousHeight: 79 }),
    {
      height: 79,
      roomBelow: 0,
      scrollTop: null,
    },
  );
});
