// The app's settings: a data folder without them has the defaults, and a change keeps the rest.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { changeAppSettings, getAppSettings } from './app-settings.ts';

test('no settings file is every setting at its default', () => {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-settings-'));
  try {
    assert.deepEqual(getAppSettings(root), { composerModel: 'opus' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a change is written and read back', () => {
  const root = mkdtempSync(join(tmpdir(), 'chiptune-settings-'));
  try {
    assert.deepEqual(changeAppSettings(root, { composerModel: 'haiku' }), {
      composerModel: 'haiku',
    });
    assert.deepEqual(changeAppSettings(root, {}), { composerModel: 'haiku' });
    assert.equal(getAppSettings(root).composerModel, 'haiku');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
