// One Furnace that renders and opens files is one row; two Furnaces are a row each.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ProgramCheck, ProgramName } from '../../shared/api.types.ts';
import { getProgramRows, hasTwoFurnaces } from './program-rows.ts';

function getCheck({ name, path }: { name: ProgramName; path: string }): ProgramCheck {
  return {
    name,
    path,
    variable: 'CHIPSMITH_X',
    neededFor: `${name}'s use`,
    version: '1.0',
    error: null,
    checkedAt: '2026-10-18T12:00:00.000Z',
  };
}

test('one Furnace for both is one row, for both uses', () => {
  const rows = getProgramRows([
    getCheck({ name: 'furnace', path: '/Furnace' }),
    getCheck({ name: 'furnaceApp', path: '/Furnace' }),
    getCheck({ name: 'ffmpeg', path: 'ffmpeg' }),
  ]);
  assert.deepEqual(
    rows.map(({ label, neededFor }) => [label, neededFor]),
    [
      ['Furnace', "furnace's use, furnaceApp's use"],
      ['ffmpeg', "ffmpeg's use"],
    ],
  );
});

test('a headless Furnace beside the app is a row each, named by what each does', () => {
  const rows = getProgramRows([
    getCheck({ name: 'furnace', path: '/build/furnace' }),
    getCheck({ name: 'furnaceApp', path: '/Furnace' }),
  ]);
  assert.deepEqual(
    rows.map(({ label }) => label),
    ['Furnace renderer', 'Furnace app'],
  );
  assert.equal(hasTwoFurnaces([getCheck({ name: 'furnace', path: '/build/furnace' })]), false);
});
