/**
 * How what Claude does in a job is said in a step's words: a tool call (reading a skill, writing or
 * changing the job's script, a command by its description, the plan's current item), and a stretch
 * of thinking (its first sentence when the log has its text); and how far a tool call shows the
 * composing has come. Words only, in lower case and without
 * a full stop: the page makes them sentences. Knows nothing of the log.
 */
import { relative, resolve } from 'node:path';
import type { ComposeStep } from '../shared/job-stages.ts';

/** The longest step kept from a line of Claude's. */
const NOTE_LENGTH = 200;

/** The longest step kept from Claude's thinking. */
const THOUGHT_LENGTH = 140;

/** The job's script, by its path from the project folder (the data folder may be elsewhere). */
const SCRIPT_PATH = /(^|\/)jobs\/[^/]+\/script\.ts$/;

/** The command that checks the job's script. */
const CHECK_COMMAND = 'make/check-script.ts';

/** A skill's instructions, by their path from the project folder. */
const SKILL_PATH = /(^|\/)\.claude\/skills\/([^/]+)\/SKILL\.md$/;

/**
 * Describes what a tool call does in a few words.
 *
 * @param name - The tool's name.
 * @param input - The tool call's input, as far as it has come.
 * @param projectFolder - The project's folder, which file paths are shown relative to.
 * @returns The words.
 */
export function describeTool(
  name: string,
  input: Record<string, unknown>,
  projectFolder: string,
): string {
  /**
   * Returns a text in the input.
   *
   * @param key - The input's field that holds the text.
   * @returns The text, or an empty string when the field is not a string.
   */
  function getText(key: string): string {
    const value = input[key];
    return typeof value === 'string' ? value : '';
  }
  const path = getText('file_path');
  const file = describeFile(path && relative(projectFolder, resolve(projectFolder, path)));
  if (name === 'Read') return `reading ${file}`;
  if (name === 'Write') return `writing ${file}${describeLines(getText('content'))}`;
  if (name === 'Edit') return `changing ${file}${describeLines(getText('new_string'))}`;
  if (name === 'Grep' || name === 'Glob') return `searching for ${shorten(getText('pattern'))}`;
  if (name === 'Bash') return shorten(getText('description') || getText('command'));
  if (name === 'Skill') return `reading the ${getText('skill') || 'next'} skill`;
  if (name === 'TodoWrite') return describePlan(input['todos']);
  return `using ${name}`;
}

/**
 * Returns how far composing has come by a tool call: writing the job's script, or running its check.
 *
 * @param name - The tool's name.
 * @param input - The tool call's input.
 * @param projectFolder - The project's folder, which the call's paths are read from.
 * @returns The step, or null for a call that shows none.
 */
export function getComposeStep(
  name: string,
  input: Record<string, unknown>,
  projectFolder: string,
): ComposeStep | null {
  const path = typeof input['file_path'] === 'string' ? input['file_path'] : '';
  const isScript = SCRIPT_PATH.test(relative(projectFolder, resolve(projectFolder, path)));
  if ((name === 'Write' || name === 'Edit') && path && isScript) return 'writing';
  const command = input['command'];
  if (name === 'Bash' && typeof command === 'string' && command.includes(CHECK_COMMAND)) {
    return 'checking';
  }
  return null;
}

/**
 * Describes a stretch of thinking.
 *
 * @param thinking - Its text, which the log often leaves empty.
 * @returns Its first sentence, shortened, or "thinking it over" when there is no text.
 */
export function describeThought(thinking: string): string {
  const text = thinking.trim().replace(/\s+/g, ' ');
  if (!text) return 'thinking it over';
  const sentence = /^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text;
  return sentence.length > THOUGHT_LENGTH ? `${sentence.slice(0, THOUGHT_LENGTH - 1)}…` : sentence;
}

/**
 * Returns a text on one line, shortened to NOTE_LENGTH.
 *
 * @param text - The text.
 * @returns The text with its whitespace made single spaces, ending in … when it was cut.
 */
export function shorten(text: string): string {
  const line = text.replace(/\s+/g, ' ');
  return line.length > NOTE_LENGTH ? `${line.slice(0, NOTE_LENGTH - 1)}…` : line;
}

/**
 * Names a file in words: the job's script, a skill, or its path.
 *
 * @param path - The file's path from the project folder.
 * @returns "the script", "the write-song skill", or the path.
 */
function describeFile(path: string): string {
  if (SCRIPT_PATH.test(path)) return 'the script';
  const skill = SKILL_PATH.exec(path)?.[2];
  return skill ? `the ${skill} skill` : path;
}

/**
 * Says how many lines a text written has.
 *
 * @param text - The text written, or an empty string while it has not come.
 * @returns " (12 lines)", or nothing when there is no text yet.
 */
function describeLines(text: string): string {
  if (!text) return '';
  const count = text.split('\n').length;
  return ` (${count} ${count === 1 ? 'line' : 'lines'})`;
}

/**
 * Describes Claude's plan by the item it is on.
 *
 * @param todos - The plan's items, not yet checked.
 * @returns "planning: " and the item in progress (or the first not done), or "planning".
 */
function describePlan(todos: unknown): string {
  if (!Array.isArray(todos)) return 'planning';
  const items = todos.flatMap((todo: unknown) =>
    typeof todo === 'object' && todo !== null && 'content' in todo && 'status' in todo
      ? [{ content: String(todo.content), status: String(todo.status) }]
      : [],
  );
  const current =
    items.find((item) => item.status === 'in_progress') ??
    items.find((item) => item.status !== 'completed');
  return current ? `planning: ${shorten(current.content)}` : 'planning';
}
