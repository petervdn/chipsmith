// A take deleted: only a take, and only when no other song plays it; the blocks that played it play
// the clip that replaces it, and the takes made from it are made from that clip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Clip, ClipRecord } from '../shared/clip.schema.ts';
import type { Song } from '../shared/song.schema.ts';
import { NES_INSTRUMENT, makeInstrument } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { buildFurFile } from '../make/fur-file-builder.ts';
import { getClipFacts } from '../make/fur-file-facts.ts';
import type { Store } from './store.ts';
import { openStore, saveClip, saveSong } from './store.ts';
import { getTakeDeletionProblem, replaceTake } from './take-deletion.ts';

const FUR_FILE = buildFurFile({
  title: 'test',
  chips: ['nes'],
  bpm: 112,
  beatsPerBar: 4,
  patternLength: 16,
  channels: [[], [], [{ note: getNoteValue('E-2'), instrument: 0 }], [], []],
  instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
});

const ORIGINAL: ClipRecord = {
  id: 'c0001',
  created: '2026-10-18T10:00:00',
  name: { section: 'A', stem: 'Bass' },
  bars: null,
  parent: null,
  variationLabel: null,
  madeFor: 's0001',
  tags: [],
  status: 'new',
  key: null,
  furnace: '0.6.8',
};

/**
 * Returns a take of a clip.
 *
 * @param id - The take's id.
 * @param parentId - The clip it was made from.
 * @returns The take's record.
 */
function getTake(id: string, parentId: string): ClipRecord {
  return {
    ...ORIGINAL,
    id,
    parent: { clip: parentId, relation: 'variation' },
    variationLabel: 'notes edited',
  };
}

/**
 * Returns a song whose one track plays the clips given, a block each.
 *
 * @param id - The song's id.
 * @param clipIds - The clips its blocks play.
 * @returns The song.
 */
function getSong(id: string, clipIds: string[]): Song {
  const blocks = clipIds.map((clip) => ({ clip, start: 0, trim: null, repeats: 1 }));
  return {
    id,
    title: `Song ${id}`,
    created: '2026-10-18T10:00:00',
    updated: '2026-10-18T10:00:00',
    bpm: 112,
    beats: 4,
    tags: [],
    status: 'new',
    prompt: '',
    guides: [],
    structure: null,
    harmony: null,
    promptedFrom: null,
    tracks: [{ id: 't1', name: 'Bass', volume: 0, blocks }],
  };
}

/**
 * Makes a data folder holding the original c0001, its take c0002 and c0002's take c0003, and a song
 * s0001 that plays c0002.
 *
 * @returns The store of that folder.
 */
function makeStore(): Store {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-takes-'));
  const store = openStore(root);
  for (const record of [ORIGINAL, getTake('c0002', 'c0001'), getTake('c0003', 'c0002')]) {
    mkdirSync(join(root, 'clips', record.id), { recursive: true });
    writeFileSync(join(root, 'clips', record.id, 'source.fur'), getFurFileBytes(FUR_FILE));
    const clip: Clip = { ...record, ...getClipFacts(FUR_FILE) };
    saveClip(store, clip);
  }
  saveSong(store, getSong('s0001', ['c0002', 'c0002']));
  return store;
}

test('a take can be deleted from the song that plays it', () => {
  assert.equal(getTakeDeletionProblem(makeStore(), 'c0002', 's0001'), null);
});

test('the original of a line cannot be deleted', () => {
  assert.match(getTakeDeletionProblem(makeStore(), 'c0001', 's0001') ?? '', /only a take/);
});

test('a take another song plays cannot be deleted', () => {
  const store = makeStore();
  saveSong(store, getSong('s0002', ['c0002']));
  assert.match(getTakeDeletionProblem(store, 'c0002', 's0001') ?? '', /Song s0002/);
});

test('a take deleted is replaced in the songs and as a parent, and its folder goes', () => {
  const store = makeStore();
  replaceTake(store, 'c0002', 'c0001');
  const reopened = openStore(store.root);
  const blocks = reopened.songs.get('s0001')?.tracks[0]?.blocks ?? [];
  assert.deepEqual(
    blocks.map((block) => block.clip),
    ['c0001', 'c0001'],
  );
  assert.deepEqual(reopened.clips.get('c0003')?.parent, { clip: 'c0001', relation: 'variation' });
  assert.equal(reopened.clips.has('c0002'), false);
  assert.equal(existsSync(join(store.root, 'clips', 'c0002')), false);
});
