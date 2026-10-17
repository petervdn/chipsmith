// A .fur file as tracker text: the song, its instruments, and each order's rows with a column per
// channel, as many lines as the pattern has rows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readFurFile } from './read.ts';
import { getTrackerText } from './tracker-text.ts';

const EXAMPLE_CLIPS = join(import.meta.dirname, '..', 'examples', 'clips');

test("an example's orders are laid out a column per channel, a line per row", () => {
  const [clipId = ''] = readdirSync(EXAMPLE_CLIPS);
  const furFile = readFurFile(readFileSync(join(EXAMPLE_CLIPS, clipId, 'source.fur')));
  const names = Array.from({ length: furFile.song.channelCount }, (_unused, i) => `ch${i}`);
  const lines = getTrackerText(furFile, names).split('\n');
  const orderAt = lines.indexOf('Order 00');
  assert.ok(orderAt > 0);
  assert.match(lines[orderAt + 1] ?? '', /^ {3}ch0 \(\d+\)/);
  assert.equal((lines[orderAt + 2]?.split(' | ') ?? []).length, furFile.song.channelCount);
  assert.match(lines[orderAt + 2] ?? '', /^00 /);
  const orderCount = furFile.song.orders[0]?.length ?? 0;
  assert.equal(lines.filter((line) => line.startsWith('Order ')).length, orderCount);
});
