/**
 * What a job's Claude knows before it starts: the composing skills (write-song, furnace-song, each
 * chip's) and the example script, read from the project when a job starts and put in its system
 * prompt, so Claude has them in its first request instead of loading them over several turns. The
 * skill files stay the one source (docs/adr/0025). Knows nothing of jobs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The skills a job composes by, in the order they are given. */
const JOB_SKILLS = ['write-song', 'furnace-song', 'nes-chip', 'psg-chip', 'scc-chip', 'sid-chip'];
/** The example of a job's script, from the project folder. */
const EXAMPLE_SCRIPT = 'make/example-script.ts';

/**
 * Returns a skill's text without its front matter (the name and description between `---` lines).
 *
 * @param skillText - The SKILL.md file's text.
 * @returns The text after the front matter, trimmed.
 */
export function getSkillBody(skillText: string): string {
  return skillText.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

/**
 * Returns the skills and the example script as one text, each under a line naming it.
 *
 * @param projectFolder - The project folder, holding `.claude/skills/` and `make/`.
 * @returns The text, to put in a job's system prompt.
 */
export function getJobKnowledge(projectFolder: string): string {
  const skills = JOB_SKILLS.map((name) => {
    const text = readFileSync(join(projectFolder, '.claude', 'skills', name, 'SKILL.md'), 'utf8');
    return `===== The ${name} skill =====\n\n${getSkillBody(text)}`;
  });
  const example = readFileSync(join(projectFolder, EXAMPLE_SCRIPT), 'utf8').trim();
  return [
    ...skills,
    `===== ${EXAMPLE_SCRIPT}, the example script =====\n\n\`\`\`ts\n${example}\n\`\`\``,
  ].join('\n\n');
}
