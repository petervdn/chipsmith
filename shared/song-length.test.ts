// A song is as long as its last block with its repeats, its trim counted, at the song's tempo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Song } from './song.schema.ts';
import { TICKS_PER_BEAT } from './ticks.ts';
import { getSongSeconds } from './song-length.ts';

test('the last block with its repeats sets the length', () => {
  const song: Song = {
    id: 's1',
    title: 't',
    created: '',
    updated: '',
    bpm: 120,
    beats: 4,
    tags: [],
    status: 'new',
    prompt: '',
    guides: [],
    structure: null,
    harmony: null,
    promptedFrom: null,
    tracks: [
      { id: 'a', name: 'A', volume: 0, blocks: [{ clip: 'c1', start: 0, trim: null, repeats: 3 }] },
      {
        id: 'b',
        name: 'B',
        volume: 0,
        blocks: [
          { clip: 'c2', start: TICKS_PER_BEAT * 4, trim: { offset: 0, length: 96 }, repeats: 1 },
        ],
      },
    ],
  };
  // c1 is 2 s (4 beats at 120 bpm), three times: 6 s; c2 ends at beat 5, 2.5 s
  assert.equal(
    getSongSeconds(song, (id) => (id === 'c1' ? 2 : 10)),
    6,
  );
});
