// A tool call is said in words that tell what it does: a skill by its name, the job's script as
// "the script" with its lines, the plan by its current item.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeThought, describeTool, getComposeStep } from './claude-words.ts';

const PROJECT = '/project';

test('skills, the script and other files in words', () => {
  assert.equal(
    describeTool('Skill', { skill: 'write-song' }, PROJECT),
    'reading the write-song skill',
  );
  const skillFile = '/project/.claude/skills/nes-chip/SKILL.md';
  assert.equal(
    describeTool('Read', { file_path: skillFile }, PROJECT),
    'reading the nes-chip skill',
  );
  const script = '/data/jobs/j0004/script.ts';
  assert.equal(
    describeTool('Edit', { file_path: script, new_string: 'a\nb' }, PROJECT),
    'changing the script (2 lines)',
  );
  assert.equal(
    describeTool('Read', { file_path: '/project/make/song-plan.ts' }, PROJECT),
    'reading make/song-plan.ts',
  );
});

test('the plan by the item it is on, an unknown tool by its name', () => {
  const todos = [
    { content: 'Write the bass', status: 'completed' },
    { content: 'Write the lead', status: 'in_progress' },
  ];
  assert.equal(describeTool('TodoWrite', { todos }, PROJECT), 'planning: Write the lead');
  assert.equal(describeTool('WebFetch', {}, PROJECT), 'using WebFetch');
});

test('a thought by its first sentence, or that it was thought over', () => {
  assert.equal(describeThought('A walking bass. Then a lead.'), 'A walking bass.');
  assert.equal(describeThought(''), 'thinking it over');
});

test('writing the script, then checking it, show how far composing has come', () => {
  const script = { file_path: '/project/data/jobs/j0001/script.ts', content: 'x' };
  assert.equal(getComposeStep('Write', script, PROJECT), 'writing');
  assert.equal(getComposeStep('Edit', script, PROJECT), 'writing');
  assert.equal(
    getComposeStep(
      'Bash',
      { command: 'node make/check-script.ts data/jobs/j0001/script.ts' },
      PROJECT,
    ),
    'checking',
  );
  assert.equal(getComposeStep('Read', script, PROJECT), null);
  assert.equal(getComposeStep('Write', { file_path: '/project/notes.md' }, PROJECT), null);
  assert.equal(getComposeStep('Bash', { command: 'node fur/dump.ts x.fur' }, PROJECT), null);
});
