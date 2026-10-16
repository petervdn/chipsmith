// The store reads what it wrote, and a file that does not fit is reported without stopping the rest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Clip } from '../shared/clip.types.ts';
import type { Song } from '../shared/song.types.ts';
import { getSongsUsingClip, openStore, saveClip, saveSong } from './store.ts';

const CLIP: Clip = {
  id: 'c0001',
  created: '2026-10-16T23:00:00',
  prompt: 'a funk groove',
  promptId: 'p0001',
  name: { section: 'A', stem: 'Bass' },
  bars: { from: 0, to: 8 },
  channels: [2],
  parent: null,
  madeFor: 's0001',
  tags: [{ name: 'funk', by: 'claude' }],
  status: 'new',
  bpm: 112,
  beats: 4,
  key: 'E minor',
  chips: ['NES'],
  seconds: 17.1,
  furnace: '0.6.8',
};

const SONG: Song = {
  id: 's0001',
  title: 'Funk groove',
  created: '2026-10-16T23:00:00',
  updated: '2026-10-16T23:00:00',
  bpm: 112,
  beats: 4,
  tags: [],
  status: 'new',
  tracks: [
    { id: 't1', name: 'Bass', blocks: [{ clip: 'c0001', start: 0, trim: null, repeats: 2 }] },
  ],
};

test('a saved clip and song read back the same', () => {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-store-'));
  const store = openStore(root);
  saveClip(store, CLIP);
  saveSong(store, SONG);
  const reopened = openStore(root);
  assert.deepEqual(reopened.clips.get('c0001'), CLIP);
  assert.deepEqual(reopened.songs.get('s0001'), SONG);
  assert.deepEqual(reopened.unreadable, []);
  assert.deepEqual(getSongsUsingClip(reopened, 'c0001'), ['s0001']);
});

test('a clip.json that does not fit is reported, and the others still read', () => {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-store-'));
  saveClip(openStore(root), CLIP);
  mkdirSync(join(root, 'clips', 'c0002'), { recursive: true });
  writeFileSync(join(root, 'clips', 'c0002', 'clip.json'), '{"id": 2}');
  const store = openStore(root);
  assert.equal(store.clips.size, 1);
  assert.equal(store.unreadable.length, 1);
  assert.match(store.unreadable[0]?.error ?? '', /\.id: not a string/);
});
