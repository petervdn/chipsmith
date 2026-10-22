// A whole song is split into a clip per channel that plays, each with its own source and the whole
// clip as its parent, alone on a track named after its channel (what the song calls it, and the
// chip's channel); its facts are read from its source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Clip } from '../shared/clip.schema.ts';
import type { Song } from '../shared/song.schema.ts';
import type { Row } from '../fur/fur.types.ts';
import { NES_INSTRUMENT, makeInstrument } from '../fur/instrument.ts';
import { getNoteValue } from '../fur/notes.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { buildFurFile } from './fur-file-builder.ts';
import { splitSong } from './split-song.ts';
import { openStore } from '../server/store.ts';

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
    chips: ['nes'],
    bpm: 120,
    beatsPerBar: 4,
    patternLength: 16,
    channels: [getBar('E-4'), [], [...getBar('D-2'), ...getBar('D-2'), ...getBar('F-2')], [], []],
    instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
    channelNames: ['Lead'],
  });
  writeFileSync(join(root, 'clips', 'c0001', 'source.fur'), getFurFileBytes(furFile));
  const whole: Clip = {
    id: 'c0001',
    created: '2026-10-17T00:00:00Z',
    name: { section: null, stem: null },
    bars: null,
    channels: [0, 2],
    parent: null,
    variationLabel: null,
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
    structure: null,
    harmony: null,
    promptedFrom: null,
    tracks: [
      {
        id: 't1',
        name: 'Whole',
        volume: 0,
        isMuted: false,
        blocks: [{ clip: 'c0001', start: 0, trim: null, repeats: 1 }],
      },
    ],
  };
  const { tracks } = splitSong(root, song, whole);
  const store = openStore(root);
  assert.deepEqual(store.unreadable, []);
  assert.deepEqual(
    [...store.clips.values()].map(({ id, name, parent, channels, seconds, furnace }) => [
      id,
      name,
      parent,
      channels,
      seconds,
      furnace,
    ]),
    [
      [
        'c0002',
        { section: null, stem: 'Lead' },
        { clip: 'c0001', relation: 'split' },
        [0],
        6,
        null,
      ],
      [
        'c0003',
        { section: null, stem: 'Triangle' },
        { clip: 'c0001', relation: 'split' },
        [2],
        6,
        null,
      ],
    ],
  );
  assert.deepEqual(tracks, [
    {
      id: 't1',
      name: 'Lead · Pulse 1',
      volume: 0,
      isMuted: false,
      blocks: [{ clip: 'c0002', start: 0, trim: null, repeats: 1 }],
    },
    {
      id: 't2',
      name: 'Triangle',
      volume: 0,
      isMuted: false,
      blocks: [{ clip: 'c0003', start: 0, trim: null, repeats: 1 }],
    },
  ]);
  assert.ok(existsSync(join(root, 'clips', 'c0002', 'source.fur')));
  assert.ok(existsSync(join(root, 'clips', 'c0003', 'clip.json')));
});
