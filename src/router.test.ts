// Every address reads as the page it is, and anything else as the songs list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRoute } from './router.ts';

test('addresses read as their pages', () => {
  assert.deepEqual(getRoute('/'), { page: 'songs' });
  assert.deepEqual(getRoute('/clips'), { page: 'clips' });
  assert.deepEqual(getRoute('/new'), { page: 'new' });
  assert.deepEqual(getRoute('/songs/s0031'), { page: 'song', songId: 's0031' });
  assert.deepEqual(getRoute('/somewhere/else'), { page: 'songs' });
});
