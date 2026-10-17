// Settings come from CHIPSMITH_ variables, with defaults for what is not set; a bad port is an error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSettings } from './settings.ts';

test('what is not set has its default', () => {
  const settings = readSettings({}, '/projects/chipsmith', '/nowhere');
  assert.equal(settings.dataFolder, '/projects/chipsmith');
  assert.equal(settings.port, 8780);
  assert.equal(settings.archiveFolder, '/projects/chiptune-archive');
  assert.equal(settings.ffmpeg, 'ffmpeg');
  assert.equal(settings.claude, 'claude');
});

test('a variable sets its setting; an empty one is not set', () => {
  const settings = readSettings(
    { CHIPSMITH_DATA: '/data', CHIPSMITH_PORT: '9000', CHIPSMITH_FFMPEG: ' ' },
    '/projects/chipsmith',
    '/nowhere',
  );
  assert.equal(settings.dataFolder, '/data');
  assert.equal(settings.port, 9000);
  assert.equal(settings.ffmpeg, 'ffmpeg');
});

test('a port that is not a number is an error', () => {
  assert.throws(() => readSettings({ CHIPSMITH_PORT: 'eighty' }, '/p', '/h'));
});
