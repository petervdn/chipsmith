// Tokens are shown in thousands from a thousand on, with a decimal below ten thousand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTokens } from './format.ts';

test('tokens in thousands from a thousand on', () => {
  assert.deepEqual([850, 1234, 14951].map(formatTokens), [
    '850 tokens',
    '1.2k tokens',
    '15k tokens',
  ]);
});
