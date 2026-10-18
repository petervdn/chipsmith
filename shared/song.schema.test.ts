// A song.json is parsed by its schema: what an older file leaves out is read as none, and a field
// that does not fit is reported with its path.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseChecked } from './schema-parse.ts';
import { songSchema, trackSchema } from './song.schema.ts';

const BLOCK = { clip: 'c0001', start: 0, trim: null, repeats: 1 };

test('a track without a level reads as 0 dB, one with a level keeps it', () => {
  const tracks = [
    { id: 't1', name: 'Lead', blocks: [BLOCK] },
    { id: 't2', name: 'Bass', volume: -6, blocks: [] },
  ].map((track) => parseChecked(trackSchema, track, 'track'));
  assert.deepEqual(
    tracks.map((track) => track.volume),
    [0, -6],
  );
});

test('a song from before guides, structures, harmonies and prompting again reads them as none', () => {
  const song = parseChecked(
    songSchema,
    {
      id: 's0001',
      title: 'Old',
      created: '2026-10-16',
      updated: '2026-10-16',
      bpm: 120,
      beats: 4,
      tags: [],
      status: 'new',
      prompt: 'a groove',
      tracks: [],
    },
    'song.json',
  );
  assert.deepEqual(
    [song.guides, song.structure, song.harmony, song.promptedFrom],
    [[], null, null, null],
  );
});

test('a field that does not fit is reported with its path', () => {
  assert.throws(
    () =>
      parseChecked(
        trackSchema,
        { id: 't1', name: 'Lead', volume: 'loud', blocks: [] },
        'tracks[0]',
      ),
    /tracks\[0\]\.volume: /,
  );
});
