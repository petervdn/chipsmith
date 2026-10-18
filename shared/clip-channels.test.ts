// A channel is named from the clip's chips; a whole clip of several channels can be split, a piece
// cut out of another cannot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChannelName, isPitchedChannel } from './clip-channels.ts';

test('channels are named from the chips, counted over them in order', () => {
  assert.deepEqual(
    [0, 2, 3, 6, 12].map((channel) => getChannelName(['NES', 'SCC+'], channel)),
    ['Pulse 1', 'Triangle', 'Noise', 'SCC 2', 'Channel 13'],
  );
  assert.deepEqual(
    [0, 4, 5, 7, 8].map((channel) => getChannelName(['NES', 'SID'], channel)),
    ['Pulse 1', 'DPCM', 'SID 1', 'SID 3', 'Channel 9'],
  );
});

test('a chip that comes again numbers its channels on', () => {
  assert.deepEqual(
    [4, 5, 9, 10].map((channel) => getChannelName(['SCC+', 'SCC+', 'SID'], channel)),
    ['SCC 5', 'SCC 6', 'SCC 10', 'SID 1'],
  );
  assert.equal(getChannelName(['NES', 'NES'], 7), 'Triangle (NES 2)');
});

test('the NES noise and DPCM channels are not pitched, wherever the NES comes', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((channel) => isPitchedChannel(['NES', 'SCC+'], channel)),
    [true, true, true, false, false, true],
  );
  assert.equal(isPitchedChannel(['SCC+', 'NES'], 8), false);
  assert.equal(isPitchedChannel(['SCC+', 'NES'], 4), true);
});
