// Note names and values go both ways; C-0 is 60, A-3 is 105.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNoteName, getNoteValue, NOTE_OFF } from './notes.ts';

test('names give values and back', () => {
  assert.equal(getNoteValue('C-0'), 60);
  assert.equal(getNoteValue('A-3'), 105);
  assert.equal(getNoteValue('C#5'), 121);
  assert.equal(getNoteValue('OFF'), NOTE_OFF);
  for (const name of ['C-0', 'A-3', 'C#5', 'B-7', 'OFF']) {
    assert.equal(getNoteName(getNoteValue(name)), name);
  }
});

test('a name that is not a note is an error', () => {
  assert.throws(() => getNoteValue('H-3'));
});
