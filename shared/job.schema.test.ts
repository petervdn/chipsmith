// A job.json is parsed by its schema: what an older job leaves out is read as none, and a harmony
// from before progressions had their mode is read as none rather than losing the job.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jobSchema } from './job.schema.ts';
import { parseChecked } from './schema-parse.ts';

const OLD_JOB = {
  id: 'j0001',
  prompt: 'a groove',
  created: '2026-10-16',
  phase: 'done',
  phaseStarted: '2026-10-16',
  finished: '2026-10-16',
  notes: [{ at: '2026-10-16', text: 'done' }],
  songs: [],
  summary: null,
  error: null,
};

test('an old job reads what it leaves out as none', () => {
  const job = parseChecked(jobSchema, OLD_JOB, 'job.json');
  assert.deepEqual(
    [job.guides, job.takesOf, job.harmony, job.removed, job.notes[0]?.stage],
    [[], null, null, null, null],
  );
});

test('a harmony that no longer fits is read as none, the job kept', () => {
  const harmony = {
    parts: [{ letter: 'A', progression: { name: 'x', chords: [{ numeral: 'i', bars: 1 }] } }],
  };
  assert.equal(parseChecked(jobSchema, { ...OLD_JOB, harmony }, 'job.json').harmony, null);
});
