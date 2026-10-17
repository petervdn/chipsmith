// Structures are kept in their files; one that does not fit is refused where it comes in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readNotation } from '../shared/structure-notation.ts';
import { checkStructureDraft } from './structure-checks.ts';
import { createStructure, deleteStructure, openStructures, updateStructure } from './structures.ts';

const SECTIONS = readNotation("A8 A'8 B8 A8").sections ?? [];

test('a structure made, changed and deleted is kept in its file', () => {
  const store = openStructures(mkdtempSync(join(tmpdir(), 'chiptune-structures-')));
  const made = createStructure(store, { name: 'AABA', sections: SECTIONS });
  assert.equal(made.id, 'f0001');
  assert.deepEqual(openStructures(store.root).structures.get('f0001'), made);
  updateStructure(store, made.id, { name: 'Song form', sections: SECTIONS.slice(0, 2) });
  assert.equal(openStructures(store.root).structures.get('f0001')?.sections.length, 2);
  deleteStructure(store, made.id);
  assert.equal(existsSync(join(store.root, 'structures', 'f0001')), false);
});

test('a structure that does not fit is refused, naming the field', () => {
  assert.throws(
    () => checkStructureDraft({ name: ' ', sections: SECTIONS }, 'body'),
    /body.name is empty/,
  );
  assert.throws(
    () => checkStructureDraft({ name: 'x', sections: [] }, 'body'),
    /body.sections has no sections/,
  );
  assert.throws(
    () => checkStructureDraft({ name: 'x', sections: [{ ...SECTIONS[0], bars: 0 }] }, 'body'),
    /body.sections\[0\].bars is not a whole number from 1 to 256/,
  );
});
