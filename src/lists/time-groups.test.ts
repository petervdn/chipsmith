// Items are grouped by when they were made: minutes for what is recent, then days.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTimeGroup, groupByTime } from './time-groups.ts';

const NOW = new Date(2026, 9, 17, 15, 0, 0).getTime();

function ago(minutes: number): string {
  return new Date(NOW - minutes * 60 * 1000).toISOString();
}

test('recent items by minutes, older ones by days', () => {
  assert.deepEqual(
    [2, 10, 40, 120, 24 * 60, 3 * 24 * 60, 30 * 24 * 60].map((minutes) =>
      getTimeGroup(ago(minutes), NOW),
    ),
    [
      'Just now',
      'Last 15 minutes',
      'Last hour',
      'Earlier today',
      'Yesterday',
      'Past week',
      'Older',
    ],
  );
});

test('a list newest first is split into its groups, in order', () => {
  const groups = groupByTime([ago(1), ago(3), ago(30), ago(90)], (made) => made, NOW);
  assert.deepEqual(
    groups.map(({ label, items }) => [label, items.length]),
    [
      ['Just now', 2],
      ['Last hour', 1],
      ['Earlier today', 1],
    ],
  );
});
