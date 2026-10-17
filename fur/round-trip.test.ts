// The check of the port (docs/adr/0002): the examples' modules (their patterns and instruments made by
// the Python tools) read with read.ts and written again with write.ts come out byte for byte the same.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getUncompressed, readModule } from './read.ts';
import { getModuleBytes } from './write.ts';

const EXAMPLE_CLIPS = join(import.meta.dirname, '..', 'examples', 'clips');

for (const clipId of readdirSync(EXAMPLE_CLIPS)) {
  test(`the module of example ${clipId} is written back byte for byte`, () => {
    const original = getUncompressed(readFileSync(join(EXAMPLE_CLIPS, clipId, 'source.fur')));
    assert.deepEqual(getModuleBytes(readModule(original)), original);
  });
}
