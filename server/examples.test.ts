// The examples go into a data folder only when it has no clips and no songs; songs there are never touched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyExamplesIfEmpty } from './examples.ts';

function makeExamples(): string {
  const examples = mkdtempSync(join(tmpdir(), 'chiptune-examples-'));
  mkdirSync(join(examples, 'clips', 'c0001'), { recursive: true });
  mkdirSync(join(examples, 'songs', 's0001'), { recursive: true });
  writeFileSync(join(examples, 'clips', 'c0001', 'clip.json'), '{"example": true}');
  writeFileSync(join(examples, 'songs', 's0001', 'song.json'), '{"example": true}');
  return examples;
}

test('an empty data folder gets the examples', () => {
  const data = mkdtempSync(join(tmpdir(), 'chiptune-data-'));
  assert.equal(copyExamplesIfEmpty(data, makeExamples()), true);
  assert.ok(existsSync(join(data, 'clips', 'c0001', 'clip.json')));
  assert.ok(existsSync(join(data, 'songs', 's0001', 'song.json')));
});

test('a data folder with songs is left as it is', () => {
  const data = mkdtempSync(join(tmpdir(), 'chiptune-data-'));
  mkdirSync(join(data, 'songs', 's0001'), { recursive: true });
  writeFileSync(join(data, 'songs', 's0001', 'song.json'), '{"mine": true}');
  assert.equal(copyExamplesIfEmpty(data, makeExamples()), false);
  assert.equal(readFileSync(join(data, 'songs', 's0001', 'song.json'), 'utf8'), '{"mine": true}');
  assert.ok(!existsSync(join(data, 'clips')));
});
