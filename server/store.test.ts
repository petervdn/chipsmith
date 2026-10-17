// The store reads what it wrote, a clip's facts from its source and never from its clip.json, and a
// file that does not fit is reported without stopping the rest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Clip, ClipRecord } from '../shared/clip.types.ts';
import type { Song } from '../shared/song.types.ts';
import { NES_INSTRUMENT, makeInstrument } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { buildFurFile } from '../make/fur-file-builder.ts';
import { getClipFacts } from '../make/fur-file-facts.ts';
import { getSongsUsingClip, openStore, saveClip, saveSong } from './store.ts';

const FUR_FILE = buildFurFile({
  title: 'test',
  chips: 'nes',
  bpm: 112,
  beatsPerBar: 4,
  patternLength: 16,
  channels: [[], [], [{ note: getNoteValue('E-2'), instrument: 0 }], [], []],
  instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
});

const RECORD: ClipRecord = {
  id: 'c0001',
  created: '2026-10-16T23:00:00',
  prompt: 'a funk groove',
  guides: [],
  promptId: 'p0001',
  name: { section: 'A', stem: 'Bass' },
  bars: { from: 0, to: 8 },
  parent: null,
  madeFor: 's0001',
  tags: [{ name: 'funk', by: 'claude' }],
  status: 'new',
  key: 'E minor',
  furnace: '0.6.8',
};

const CLIP: Clip = { ...RECORD, ...getClipFacts(FUR_FILE) };

/**
 * Makes a data folder with the clip's source.fur in its folder.
 *
 * @returns The data folder.
 */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-store-'));
  mkdirSync(join(root, 'clips', CLIP.id), { recursive: true });
  writeFileSync(join(root, 'clips', CLIP.id, 'source.fur'), getFurFileBytes(FUR_FILE));
  return root;
}

const SONG: Song = {
  id: 's0001',
  title: 'Funk groove',
  created: '2026-10-16T23:00:00',
  updated: '2026-10-16T23:00:00',
  bpm: 112,
  beats: 4,
  tags: [],
  status: 'new',
  prompt: '',
  guides: [],
  structure: null,
  promptedFrom: null,
  tracks: [
    { id: 't1', name: 'Bass', blocks: [{ clip: 'c0001', start: 0, trim: null, repeats: 2 }] },
  ],
};

test('a saved clip and song read back the same', () => {
  const root = makeRoot();
  const store = openStore(root);
  saveClip(store, CLIP);
  saveSong(store, SONG);
  const reopened = openStore(root);
  assert.deepEqual(reopened.clips.get('c0001'), CLIP);
  assert.deepEqual(reopened.songs.get('s0001'), SONG);
  assert.deepEqual(reopened.unreadable, []);
  assert.deepEqual(getSongsUsingClip(reopened, 'c0001'), ['s0001']);
});

test('a clip.json holds its record, and its facts are read from its source', () => {
  const root = makeRoot();
  saveClip(openStore(root), CLIP);
  const written: unknown = JSON.parse(
    readFileSync(join(root, 'clips', CLIP.id, 'clip.json'), 'utf8'),
  );
  assert.deepEqual(written, RECORD);
  assert.deepEqual(CLIP.channels, [2]);
  assert.equal(CLIP.bpm, 112);
});

test('a clip without its source is reported', () => {
  const root = makeRoot();
  saveClip(openStore(root), CLIP);
  mkdirSync(join(root, 'clips', 'c0002'), { recursive: true });
  writeFileSync(
    join(root, 'clips', 'c0002', 'clip.json'),
    JSON.stringify({ ...RECORD, id: 'c0002' }),
  );
  const store = openStore(root);
  assert.equal(store.clips.size, 1);
  assert.match(store.unreadable[0]?.error ?? '', /source\.fur/);
});

test('a clip.json that does not fit is reported, and the others still read', () => {
  const root = makeRoot();
  saveClip(openStore(root), CLIP);
  mkdirSync(join(root, 'clips', 'c0002'), { recursive: true });
  writeFileSync(join(root, 'clips', 'c0002', 'clip.json'), '{"id": 2}');
  const store = openStore(root);
  assert.equal(store.clips.size, 1);
  assert.equal(store.unreadable.length, 1);
  assert.match(store.unreadable[0]?.error ?? '', /\.id: not a string/);
});
