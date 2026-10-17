// The titles a job's songs are asked for, and the ones a script gives that are taken.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getTakenTitles, getTitleWordCounts, readSongTitles } from './song-titles.ts';

test('a title is asked for in 2 to 6 words, each as likely', () => {
  const randoms = [0, 0.199, 0.2, 0.5, 0.8, 0.999];
  let i = 0;
  assert.deepEqual(
    getTitleWordCounts(6, () => randoms[i++] ?? 0),
    [2, 2, 3, 4, 6, 6],
  );
  assert.deepEqual(getTitleWordCounts(0), []);
});

test('a title made before, or given twice, is taken; case and spaces aside', () => {
  assert.deepEqual(
    getTakenTitles(
      ['Phrygian  mirrorball', 'Amber Gate', 'Lantern', 'amber gate', 'Amber Gate'],
      ['Phrygian Mirrorball', 'Seven Teeth'],
    ),
    [
      '"Phrygian  mirrorball" is the title of a song made before',
      '"amber gate" is the title of another song of this script',
      '"Amber Gate" is the title of another song of this script',
    ],
  );
  assert.deepEqual(getTakenTitles(['New One'], ['Old One']), []);
});

test('the titles of the songs in a data folder', () => {
  const songsFolder = mkdtempSync(join(tmpdir(), 'chiptune-titles-'));
  try {
    const songs = [
      { songId: 's0001', contents: JSON.stringify({ title: 'Seven Teeth' }) },
      { songId: 's0002', contents: 'not json' },
      { songId: 's0003', contents: JSON.stringify({ name: 'no title' }) },
    ];
    for (const { songId, contents } of songs) {
      mkdirSync(join(songsFolder, songId));
      writeFileSync(join(songsFolder, songId, 'song.json'), contents);
    }
    assert.deepEqual(readSongTitles(songsFolder), ['Seven Teeth']);
    assert.deepEqual(readSongTitles(join(songsFolder, 'none')), []);
  } finally {
    rmSync(songsFolder, { recursive: true, force: true });
  }
});
