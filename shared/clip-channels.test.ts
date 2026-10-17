// A channel is named from the clip's chips; a whole clip of several channels can be split, a piece
// cut out of another cannot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChannelName } from './clip-channels.ts';

test('channels are named from the chips, counted over them in order', () => {
  assert.deepEqual(
    [0, 2, 3, 6, 12].map((channel) => getChannelName(['NES', 'SCC+'], channel)),
    ['Pulse 1', 'Triangle', 'Noise', 'SCC 2', 'Channel 13'],
  );
});
