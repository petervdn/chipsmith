// A job's knowledge holds every composing skill without its front matter, and the example script.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PROJECT_FOLDER } from '../config/settings.ts';
import { getJobKnowledge, getSkillBody } from './job-knowledge.ts';

test("a skill's front matter is left out", () => {
  assert.equal(getSkillBody('---\nname: x\ndescription: y\n---\n\n# X\n\nText.\n'), '# X\n\nText.');
  assert.equal(getSkillBody('# No front matter'), '# No front matter');
});

test('the knowledge has every composing skill and the example script', () => {
  const knowledge = getJobKnowledge(PROJECT_FOLDER);
  for (const name of [
    'write-song',
    'furnace-song',
    'nes-chip',
    'psg-chip',
    'scc-chip',
    'sid-chip',
  ]) {
    assert.match(knowledge, new RegExp(`===== The ${name} skill =====`));
  }
  assert.match(knowledge, /make\/example-script\.ts, the example script/);
  assert.doesNotMatch(knowledge, /^name: /m);
});
