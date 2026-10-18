// Every address reads as the page it is, and anything else as the home page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRoute } from './router.ts';

test('addresses read as their pages', () => {
  assert.deepEqual(getRoute('/'), { page: 'home' });
  assert.deepEqual(getRoute('/songs'), { page: 'songs', isFavoritesOnly: false });
  assert.deepEqual(getRoute('/songs?tag=funk'), { page: 'songs', isFavoritesOnly: false });
  assert.deepEqual(getRoute('/songs/favorites'), { page: 'songs', isFavoritesOnly: true });
  assert.deepEqual(getRoute('/songs/favorites?q=dark'), { page: 'songs', isFavoritesOnly: true });
  assert.deepEqual(getRoute('/clips'), { page: 'clips' });
  assert.deepEqual(getRoute('/guides'), { page: 'guides' });
  assert.deepEqual(getRoute('/new'), { page: 'new' });
  assert.deepEqual(getRoute('/jobs'), { page: 'jobs' });
  assert.deepEqual(getRoute('/new?from=s0031'), { page: 'new' });
  assert.deepEqual(getRoute('/songs/s0031'), { page: 'song', songId: 's0031' });
  assert.deepEqual(getRoute('/references'), { page: 'references' });
  assert.deepEqual(getRoute('/references/r0003'), { page: 'reference', referenceId: 'r0003' });
  assert.deepEqual(getRoute('/somewhere/else'), { page: 'home' });
});
