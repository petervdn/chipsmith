// The list filter needs every chosen tag and finds every word.
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
  isKept: true,
};
const FUGUE: FilterableItem = { text: 'Fugue', tags: [], isKept: false };

test('every chosen tag must be there', () => {
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, tags: ['funk', 'bass'] }), true);
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, tags: ['funk', 'lead'] }), false);
});

test('every word is found, in the text or the tags', () => {
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, words: 'groove bass' }), true);
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, words: 'groove lead' }), false);
});

test('only the kept show when asked', () => {
  assert.equal(isShown(FUNK_BASS, { ...EMPTY_FILTER, isKeptOnly: true }), true);
  assert.equal(isShown(FUGUE, { ...EMPTY_FILTER, isKeptOnly: true }), false);
  assert.equal(isShown(FUGUE, EMPTY_FILTER), true);
});

test('tags are counted, most used first', () => {
  assert.deepEqual(
    getTagCounts([FUNK_BASS, { ...FUGUE, tags: [{ name: 'funk', by: 'claude' }] }]),
    [
      { name: 'funk', count: 2 },
      { name: 'bass', count: 1 },
    ],
  );
});

test('a filter goes into the address and comes back the same', () => {
  const filter = { words: 'dark groove', tags: ['funk', 'bass'], isKeptOnly: true };
  const query = getFilterQuery(filter);
  assert.equal(query, '?q=dark+groove&tags=funk,bass&favorites=1');
  assert.deepEqual(getFilterFromQuery(query), filter);
  assert.equal(getFilterQuery(EMPTY_FILTER), '');
  assert.deepEqual(getFilterFromQuery(''), EMPTY_FILTER);
});
