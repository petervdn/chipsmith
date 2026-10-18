// A step lasts until the next one, the last until the job's end; its share is of the whole job.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { JobNote } from '../../shared/job.schema.ts';
import { getStageStarts, getStepLengths, getStepText } from './job-steps.ts';

test('each step until the next, the last until the end', () => {
  const notes = [
    { at: '2026-10-17T10:00:00Z', text: 'Claude starts composing', tokens: null, stage: null },
    { at: '2026-10-17T10:00:10Z', text: 'reading', tokens: null, stage: null },
    { at: '2026-10-17T10:01:10Z', text: 'writing', tokens: null, stage: null },
  ];
  assert.deepEqual(getStepLengths(notes, '2026-10-17T10:00:00Z', '2026-10-17T10:01:40Z'), [
    { seconds: 10, share: 0.1 },
    { seconds: 60, share: 0.6 },
    { seconds: 30, share: 0.3 },
  ]);
});

test('a step starts with a capital and ends with no full stop', () => {
  assert.equal(getStepText('rendering 1 song'), 'Rendering 1 song');
  assert.equal(getStepText('Reading the write-song skill.'), 'Reading the write-song skill');
  assert.equal(getStepText('writing the script…'), 'Writing the script…');
  assert.equal(getStepText('It is in 9/8. A riff sinks.'), 'It is in 9/8. A riff sinks');
  assert.equal(getStepText('  '), '');
});

test('a stage starts at the first step that shows the job in it, and only there', () => {
  const stages: JobNote['stage'][] = [
    'preparing',
    null,
    'writing',
    'writing',
    null,
    'checking',
    'writing',
    'building',
    'rendering',
    'done',
  ];
  const notes = stages.map((stage) => ({
    at: '2026-10-17T10:00:00Z',
    text: '',
    tokens: null,
    stage,
  }));
  assert.deepEqual(getStageStarts(notes), [
    'preparing',
    null,
    'writing',
    null,
    null,
    'checking',
    null,
    'building',
    'rendering',
    'done',
  ]);
});
