// A quick ask is the whole of an empty prompt, and follows a written one after a comma.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addAsk } from './clip-prompt.ts';

test('an ask is the whole of an empty prompt', () => {
  assert.equal(addAsk('  ', 'busier'), 'busier');
});

test('an ask follows a written prompt after a comma, or after its own punctuation', () => {
  assert.equal(addAsk('walking bass', 'busier'), 'walking bass, busier');
  assert.equal(addAsk('walking bass.', 'busier'), 'walking bass. busier');
});
