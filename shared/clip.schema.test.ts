// A clip.json is parsed by its schema: a variation has a label, trimmed, and no other clip has one.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clipRecordSchema } from './clip.schema.ts';
import { parseChecked } from './schema-parse.ts';

const RECORD = {
  id: 'c0002',
  created: '2026-10-18',
  name: { section: null, stem: 'Bass' },
  bars: null,
  parent: { clip: 'c0001', relation: 'variation' },
  variationLabel: ' walking bass ',
  madeFor: 's0001',
  tags: [],
  status: 'new',
  key: null,
  furnace: null,
};

test('a variation keeps its label, trimmed; a cut has none', () => {
  assert.equal(parseChecked(clipRecordSchema, RECORD, 'clip.json').variationLabel, 'walking bass');
  const cut = { ...RECORD, parent: { clip: 'c0001', relation: 'split' }, variationLabel: null };
  assert.equal(parseChecked(clipRecordSchema, cut, 'clip.json').variationLabel, null);
});

test('a variation without a label, or a label on a clip that is not one, is reported', () => {
  assert.throws(
    () => parseChecked(clipRecordSchema, { ...RECORD, variationLabel: '  ' }, 'clip.json'),
    /clip\.json\.variationLabel: is empty/,
  );
  assert.throws(
    () => parseChecked(clipRecordSchema, { ...RECORD, parent: null }, 'clip.json'),
    /variationLabel: is set, but the clip is not a variation/,
  );
});

test('the facts read from a clip’s source are not kept in its record', () => {
  const record = parseChecked(clipRecordSchema, { ...RECORD, bpm: 120, seconds: 8 }, 'clip.json');
  assert.equal('bpm' in record, false);
});
