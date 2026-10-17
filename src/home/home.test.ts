// The home page's latest songs are the newest first, and its counts tell the kept and the new.
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
      structure: null,
      harmony: null,
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
  getListing({ id: 's0002', created: '2026-10-03T10:00:00Z', status: 'heard' }),
  getListing({ id: 's0003', created: '2026-10-02T10:00:00Z', status: 'new' }),
  getListing({ id: 's0004', created: '2026-10-04T10:00:00Z', status: 'heard' }),
];

test('the latest songs are the newest first', () => {
  const latest = getLatestSongs(LISTINGS, 2).map(({ song }) => song.id);
  assert.deepEqual(latest, ['s0004', 's0002']);
});

test('the counts tell the kept and the new', () => {
  assert.deepEqual(getSongCounts(LISTINGS), { songCount: 4, keeperCount: 1, newCount: 1 });
});
