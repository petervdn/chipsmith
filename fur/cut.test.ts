// A .fur file is cut by channel: the channels that play notes, and a channel's own file with every
// other channel's notes taken out and their effects kept.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFurFile } from '../make/fur-file-builder.ts';
import { getChannelFurFile, getPlayingChannels } from './cut.ts';
import type { Row } from './fur.types.ts';
import { NES_INSTRUMENT, makeInstrument } from './instrument.ts';
import { getNoteValue } from './notes.ts';

function getBar(note: string, effects?: Row['effects']): (Row | null)[] {
  return Array.from({ length: 16 }, (_row, i) =>
    i % 4 === 0
      ? { note: getNoteValue(note), instrument: 0, ...(effects ? { effects } : {}) }
      : null,
  );
}

const FUR_FILE = buildFurFile({
  title: 'test',
  chips: ['nes'],
  bpm: 120,
  beatsPerBar: 4,
  patternLength: 16,
  channels: [
    getBar('E-4', [{ code: 0x0f, value: 3 }]),
    [],
    [...getBar('D-2'), ...getBar('F-2')],
    [],
    [],
  ],
  instruments: [makeInstrument('bass', NES_INSTRUMENT, [])],
});

test('the playing channels are found', () => {
  assert.deepEqual(getPlayingChannels(FUR_FILE), [0, 2]);
});

test("a channel's file keeps its notes, and only the effects of the others", () => {
  const triangle = getChannelFurFile(FUR_FILE, 2);
  assert.deepEqual(getPlayingChannels(triangle), [2]);
  assert.deepEqual(triangle.song, FUR_FILE.song);
  const pulse = triangle.patterns.find(
    (pattern) => pattern.channel === 0 && pattern.rows.some(Boolean),
  );
  assert.deepEqual(pulse?.rows[0], { effects: [{ code: 0x0f, value: 3 }] });
});
