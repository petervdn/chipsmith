// A random prompt takes one of each part, and says "song" for one song.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRandomPrompt } from './random-prompt.ts';

test('the first of every part', () => {
  assert.equal(
    getRandomPrompt(() => 0),
    'One dark song: funk grooves for the NES, in 4/4, with a walking bass.',
  );
});

test('the last of every part, never past it', () => {
  assert.equal(
    getRandomPrompt(() => 0.9999),
    'Three restless songs: baroque dances for the NES with the SCC, with a syncopated groove, with the melody doubled in octaves.',
  );
});
