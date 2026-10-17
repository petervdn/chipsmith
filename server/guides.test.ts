// Guides are kept in their files, and what is sent with a prompt is a copy that a later change leaves alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGuide, deleteGuide, getSentGuides, openGuides, updateGuide } from './guides.ts';

function makeStore() {
  return openGuides(mkdtempSync(join(tmpdir(), 'chiptune-guides-')));
}

test('a guide made is read back from its file', () => {
  const store = makeStore();
  const guide = createGuide(store, { name: 'Funk', text: 'Fills matter.', isDefault: false });
  assert.equal(guide.id, 'g0001');
  assert.deepEqual(openGuides(store.root).guides.get('g0001'), guide);
});

test('a guide sent is a copy: changing or deleting the guide leaves it as it was', () => {
  const store = makeStore();
  const { id } = createGuide(store, { name: 'Funk', text: 'Fills matter.', isDefault: true });
  const sent = getSentGuides(store, [id]);
  updateGuide(store, id, { name: 'Funk', text: 'No fills.', isDefault: true });
  deleteGuide(store, id);
  assert.deepEqual(sent, [{ id, name: 'Funk', text: 'Fills matter.' }]);
  assert.equal(existsSync(join(store.root, 'guides', id)), false);
  assert.equal(openGuides(store.root).guides.size, 0);
});

test('an unknown guide is an error', () => {
  assert.throws(() => getSentGuides(makeStore(), ['g0404']));
});
