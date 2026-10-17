// A whole song is split into a clip per piece, each with its own source and the whole clip as its
// parent, and tracks that place them: a piece played again in a row is one block repeated.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Clip } from '../shared/clip.types.ts';
import type { Song } from '../shared/song.types.ts';
import type { Row } from '../fur/fur.types.ts';
import { NES_INSTRUMENT, makeInstrument } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { buildFurFile } from './fur-file-builder.ts';
import { splitSong } from './split-song.ts';

function getBar(note: string): (Row | null)[] {
  return Array.from({ length: 16 }, (_row, i) =>
    i % 4 === 0 ? { note: getNoteValue(note), instrument: 0 } : null,
  );
}

test('a whole song becomes a track per channel of blocks of new clips', () => {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-split-'));
  mkdirSync(join(root, 'clips', 'c0001'), { recursive: true });
  const furFile = buildFurFile({
    title: 'test',
    chips: 'nes',
    bpm: 120,
    beatsPerBar: 4,
    patternLength: 16,
    channels: [[], [], [...getBar('D-2'), ...getBar('D-2'), ...getBar('F-2')], [], []],
    instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
  });
  writeFileSync(join(root, 'clips', 'c0001', 'source.fur'), getFurFileBytes(furFile));
  const whole: Clip = {
    id: 'c0001',
    created: '2026-10-17T00:00:00Z',
    prompt: 'a bass line',
    guides: [],
    promptId: 'j0001',
    name: { section: null, stem: null },
    bars: null,
    channels: null,
    parent: null,
    madeFor: 's0001',
    tags: [],
    status: 'keeper',
    bpm: 120,
    beats: 4,
    key: 'D minor',
    chips: ['NES'],
    seconds: 6,
    furnace: '0.6.8.3',
  };
  const song: Song = {
    id: 's0001',
    title: 'Test',
    created: '',
    updated: '',
    bpm: 120,
    beats: 4,
    tags: [],
    status: 'keeper',
    prompt: 'a bass line',
    guides: [],
    promptedFrom: null,
    tracks: [
      { id: 't1', name: 'Whole', blocks: [{ clip: 'c0001', start: 0, trim: null, repeats: 1 }] },
    ],
  };
  const { tracks, clips } = splitSong(root, song, whole);
  assert.deepEqual(
    clips.map(({ id, name, bars, channels, parent, seconds }) => [
      id,
      name,
      bars,
      channels,
      parent,
      seconds,
    ]),
    [
      [
        'c0002',
        { section: 'A', stem: 'Triangle' },
        { from: 0, to: 1 },
        [2],
        { clip: 'c0001', relation: 'split' },
        2,
      ],
      [
        'c0003',
        { section: 'B', stem: 'Triangle' },
        { from: 2, to: 3 },
        [2],
        { clip: 'c0001', relation: 'split' },
        2,
      ],
    ],
  );
  assert.deepEqual(tracks, [
    {
      id: 't1',
      name: 'Triangle',
      blocks: [
        { clip: 'c0002', start: 0, trim: null, repeats: 2 },
        { clip: 'c0003', start: 768, trim: null, repeats: 1 },
      ],
    },
  ]);
  assert.ok(existsSync(join(root, 'clips', 'c0002', 'source.fur')));
  assert.ok(existsSync(join(root, 'clips', 'c0003', 'clip.json')));
});
