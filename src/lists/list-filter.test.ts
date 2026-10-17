// The list filter hides the rejected unless asked, needs every chosen tag, and finds every word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FilterableItem } from './list-filter.ts';
import {
  EMPTY_FILTER,
  getFilterFromQuery,
  getFilterQuery,
  getTagCounts,
  isShown,
} from './list-filter.ts';

const FUNK_BASS: FilterableItem = {
  text: 'Funk groove 2',
  tags: [
    { name: 'funk', by: 'claude' },
    { name: 'bass', by: 'user' },
  ],
  status: 'keeper',
};
const REJECTED: FilterableItem = { text: 'Fugue', tags: [], status: 'rejected' };

test('rejected items show only when asked', () => {
  assert.equal(isShown(REJECTED, EMPTY_FILTER), false);
  assert.equal(isShown(REJECTED, { ...EMPTY_FILTER, isShowingRejected: true }), true);
});

test('every chosen tag must be there', () => {
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, tags: ['funk', 'bass'] }), true);
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, tags: ['funk', 'lead'] }), false);
});

test('every word is found, in the text or the tags', () => {
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, words: 'groove bass' }), true);
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, words: 'groove lead' }), false);
});

test('tags are counted, most used first', () => {
  assert.deepEqual(
    getTagCounts([FUNK_BASS, { ...REJECTED, tags: [{ name: 'funk', by: 'claude' }] }]),
    [
      { name: 'funk', count: 2 },
      { name: 'bass', count: 1 },
    ],
  );
});

test('a filter goes into the address and comes back the same', () => {
  const filter = { words: 'dark groove', tags: ['funk', 'bass'], isShowingRejected: true };
  const query = getFilterQuery(filter);
  assert.equal(query, '?q=dark+groove&tags=funk,bass&rejected=1');
  assert.deepEqual(getFilterFromQuery(query), filter);
  assert.equal(getFilterQuery(EMPTY_FILTER), '');
  assert.deepEqual(getFilterFromQuery(''), EMPTY_FILTER);
});
