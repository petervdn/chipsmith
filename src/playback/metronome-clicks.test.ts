// The metronome clicks on every beat of a stretch of the song, the first beat of each bar marked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getClicks } from './metronome-clicks.ts';

test('a click on every beat, the first of each bar marked', () => {
  assert.deepEqual(getClicks(0, 2, { bpm: 120, beatsPerBar: 3 }), [
    { second: 0, isDownbeat: true },
    { second: 0.5, isDownbeat: false },
    { second: 1, isDownbeat: false },
    { second: 1.5, isDownbeat: true },
  ]);
});

test('a stretch takes the beat at its start and not the one at its end', () => {
  const tempo = { bpm: 60, beatsPerBar: 4 };
  assert.deepEqual(
    getClicks(4, 5, tempo).map((click) => click.second),
    [4],
  );
  assert.deepEqual(getClicks(4.2, 4.9, tempo), []);
  assert.deepEqual(getClicks(4, 4, tempo), []);
});
