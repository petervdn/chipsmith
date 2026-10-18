// Tests of song-export.ts: the file's name, each track's gain in the mix, and how far a peak goes
// over full scale.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getExportFormat } from '../../shared/audio-export.ts';
import type { Track } from '../../shared/song.schema.ts';
import { getDecibelsOver, getExportFileName, getExportTrackGains } from './song-export.ts';

test("a file's name is the title, without what a name cannot hold, and the type's ending", () => {
  const flac = getExportFormat('flac');
  assert.ok(flac);
  assert.equal(getExportFileName('FZ 01 / lydian: drift?', flac), 'FZ 01 - lydian- drift-.flac');
  assert.equal(getExportFileName('  ', flac), 'song.flac');
});

test('a track goes in at its fader, and one left out at 0', () => {
  const tracks: Track[] = [
    { id: 't1', name: 'a', volume: 0, blocks: [] },
    { id: 't2', name: 'b', volume: -6, blocks: [] },
    { id: 't3', name: 'c', volume: 0, blocks: [] },
  ];
  const gains = getExportTrackGains(tracks, ['t3']);
  assert.equal(gains['t1'], 1);
  assert.ok(Math.abs((gains['t2'] ?? 0) - 0.501) < 0.001);
  assert.equal(gains['t3'], 0);
});

test('a peak over full scale is said in decibels', () => {
  assert.equal(getDecibelsOver(1), null);
  assert.equal(getDecibelsOver(2), 6);
});
