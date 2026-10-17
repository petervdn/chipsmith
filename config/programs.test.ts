// The version is read from what each program prints, the way each prints it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readVersion } from './programs.ts';

test("each program's version is read from its answer", () => {
  assert.equal(
    readVersion('furnace', '[debug] config…\nFurnace version 0.6.8.3.\n\ncopyright'),
    '0.6.8.3',
  );
  assert.equal(readVersion('ffmpeg', 'ffmpeg version 9.0.1 Copyright (c) 2000-2026'), '9.0.1');
  assert.equal(readVersion('claude', '2.1.302 (Claude Code)\n'), '2.1.302');
  assert.equal(readVersion('node', 'v24.19.0\n'), '24.19.0');
  assert.equal(readVersion('furnace', 'usage: furnace [params]'), null);
});
