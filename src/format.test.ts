// Tokens are shown in thousands, with a decimal below ten thousand and at least 0.1k for some; a
// time is shown to the second.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, formatTokenCount, formatTokens } from './format.ts';

test('tokens in thousands', () => {
  assert.deepEqual([850, 1234, 14951].map(formatTokens), [
    '0.9k tokens',
    '1.2k tokens',
    '15k tokens',
  ]);
});

test('a token count is the number alone, at least 0.1k for some', () => {
  assert.deepEqual([0, 30, 86, 203, 850, 1234, 9960, 14951].map(formatTokenCount), [
    '0k',
    '0.1k',
    '0.1k',
    '0.2k',
    '0.9k',
    '1.2k',
    '10k',
    '15k',
  ]);
});

test('a time is shown to the second, and text that is not a date as it is', () => {
  const morning = new Date(2026, 9, 18, 9, 5, 7).toISOString();
  assert.equal(formatTime(morning), '09:05:07');
  assert.equal(formatTime('not a date'), 'not a date');
});
