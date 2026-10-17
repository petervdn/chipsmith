// The home page's latest songs are the newest first, without the rejected, and its counts leave
// them out too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SongListing } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.types.ts';
import { getLatestSongs, getSongCounts } from './home.ts';

function getListing({ id, created, status }: { id: string; created: string; status: Status }) {
  const listing: SongListing = {
    song: {
      id,
      title: id,
      created,
      updated: created,
      bpm: 120,
      beats: 4,
      tags: [],
      status,
      prompt: '',
      guides: [],
      promptedFrom: null,
      tracks: [],
    },
    seconds: 30,
    clipCount: 1,
    isWaitingForAudio: false,
    isChangedAfterPrompt: false,
    key: null,
    chips: [],
    promptedAgainAs: [],
  };
  return listing;
}

const LISTINGS = [
  getListing({ id: 's0001', created: '2026-10-01T10:00:00Z', status: 'keeper' }),
  getListing({ id: 's0002', created: '2026-10-03T10:00:00Z', status: 'rejected' }),
  getListing({ id: 's0003', created: '2026-10-02T10:00:00Z', status: 'new' }),
  getListing({ id: 's0004', created: '2026-10-04T10:00:00Z', status: 'heard' }),
];

test('the latest songs are the newest first, without the rejected', () => {
  const latest = getLatestSongs(LISTINGS, 2).map(({ song }) => song.id);
  assert.deepEqual(latest, ['s0004', 's0003']);
});

test('the counts leave the rejected out', () => {
  assert.deepEqual(getSongCounts(LISTINGS), { songCount: 3, keeperCount: 1, newCount: 1 });
});
