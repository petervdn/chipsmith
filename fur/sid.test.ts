// A SID instrument's `64` feature is read and written again byte for byte, for every instrument of
// the C64 demos our reader reads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ByteReader } from './bytes.ts';
import { readFurFile } from './read.ts';
import { makeSidFeature, readSidFeature } from './sid.ts';

const DEMOS = join(import.meta.dirname, '..', 'references', 'furnace', 'demos', 'c64');

/**
 * Returns the `64` feature of an instrument block, its code and length included, if it has one.
 *
 * @param block - The INS2 block.
 * @returns The feature's bytes, or null.
 */
function getSidFeature(block: Uint8Array): Uint8Array | null {
  const reader = new ByteReader(block, 12);
  while (reader.position < block.length) {
    const start = reader.position;
    const code = reader.ascii(2);
    if (code === 'EN') return null;
    const length = reader.u16();
    if (code === '64') return block.slice(start, start + 4 + length);
    reader.position += length;
  }
  return null;
}

test('every SID instrument of the demos is written back as it was', () => {
  let count = 0;
  for (const name of readdirSync(DEMOS)) {
    let blocks: Uint8Array[];
    try {
      blocks = readFurFile(readFileSync(join(DEMOS, name))).instruments;
    } catch {
      continue;
    }
    for (const block of blocks) {
      const feature = getSidFeature(block);
      if (!feature || feature.length !== 13) continue;
      assert.deepEqual(makeSidFeature(readSidFeature(feature.slice(4))), feature, name);
      count += 1;
    }
  }
  assert.ok(count >= 30, `only ${count} instruments`);
});

test('the waves, envelope and filter of a plucked filtered bass', () => {
  const feature = makeSidFeature({
    waves: ['pulse'],
    attack: 0,
    decay: 9,
    sustain: 0,
    release: 0,
    isFiltered: true,
    isFilterSet: true,
    cutoff: 2047,
    resonance: 15,
    filterModes: ['low'],
  });
  assert.deepEqual(
    Array.from(feature.slice(4)),
    [0x54, 0x01, 0x09, 0x00, 0x00, 0x08, 0xff, 0xf7, 0x10],
  );
});
