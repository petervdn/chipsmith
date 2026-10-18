// A song's page shows its facts with their labels, leaving out what it has none of; a structure is
// told in a few words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Clip } from '../../../shared/clip.schema.ts';
import type { Song } from '../../../shared/song.schema.ts';
import { getPromptFacts, getSongFacts, getStructureText } from './song-summary.ts';

const CLIP: Clip = {
  id: 'c1',
  created: '2026-10-17T00:00:00.000Z',
  name: { section: null, stem: null },
  bars: null,
  parent: null,
  variationLabel: null,
  madeFor: null,
  tags: [],
  status: 'new',
  key: 'F# minor',
  furnace: null,
  bpm: 120,
  beats: 4,
  chips: ['NES', 'SCC'],
  channels: [0],
  seconds: 65,
};

const SONG: Song = {
  id: 's1',
  title: 'Seven Teeth',
  created: '2026-10-17T00:00:00.000Z',
  updated: '2026-10-17T00:00:00.000Z',
  bpm: 120.4,
  beats: 4,
  tags: [],
  status: 'new',
  prompt: 'a song',
  guides: [],
  structure: null,
  harmony: null,
  promptedFrom: null,
  tracks: [
    {
      id: 't1',
      name: 'All',
      volume: 0,
      blocks: [{ clip: 'c1', start: 0, trim: null, repeats: 1 }],
    },
  ],
};

test('the song’s facts, labelled, without a change it never had', () => {
  const facts = getSongFacts(SONG, [CLIP]);
  assert.deepEqual(
    facts.filter(({ label }) => label !== 'made').map(({ label, value }) => `${label}: ${value}`),
    [
      'tempo: 120 bpm',
      'meter: 4/4',
      'length: 1:05',
      'chips: NES + SCC',
      'key: F# minor',
      'tracks: 1',
      'clips: 1',
      'id: s1',
    ],
  );
});

test('what the prompt was sent with, only what there was', () => {
  assert.deepEqual(getPromptFacts(SONG), []);
  const facts = getPromptFacts({
    ...SONG,
    guides: [{ id: 'g1', name: 'Konami', text: '' }],
    tags: [{ name: 'fugue', by: 'user' }],
  });
  assert.deepEqual(
    facts.map(({ label }) => label),
    ['style guides', 'tags'],
  );
});

test('a structure in a few words', () => {
  const section = { bars: 8, role: null, energy: null, note: '', leadIn: [] };
  const text = getStructureText({
    name: 'AABA',
    sections: [
      { ...section, letter: 'A', variant: 0 },
      { ...section, letter: 'A', variant: 1 },
      { ...section, letter: 'B', variant: 0 },
      { ...section, letter: 'A', variant: 0 },
    ],
  });
  assert.equal(text, 'AABA · A A′ B A · 32 bars');
  assert.equal(
    getStructureText({
      name: 'AABA (8 bars)',
      sections: [{ ...section, letter: 'A', variant: 0 }],
    }),
    'AABA (8 bars) · A',
  );
});
