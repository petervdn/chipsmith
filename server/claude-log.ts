/**
 * A Claude run's log (stream-json, partial messages on) read as it grows: Claude's lines and what its
 * tools do become notes, what it is in the middle of (thinking, a line or a file being written) is
 * read as it happens, and its result ends the run. Knows nothing of how the run was started.
 */
import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

/**
 * What Claude is in the middle of, as far as the log has gone: nothing that shows, thinking (with
 * the tokens so far), a line of text, or a tool call whose input is still coming.
 */
export type Progress =
  | { kind: 'idle' }
  | { kind: 'thinking'; tokens: number }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; name: string; input: string };

/** Where a run's log was read to, and what Claude was in the middle of there. */
export type LogPlace = { position: number; progress: Progress };

/**
 * What a run's log has said since it was last read: notes, its result at the end, where it was read
 * to, and what Claude is doing now (null when the last note says it).
 */
export type LogNews = LogPlace & { notes: string[]; result: RunResult | null; now: string | null };

/** Nothing read yet. */
export const LOG_START: LogPlace = { position: 0, progress: { kind: 'idle' } };

/** How a run ended: Claude's reply, and whether it was an error. */
export type RunResult = { text: string; isError: boolean };

/** The longest note kept from a line of Claude's. */
const NOTE_LENGTH = 200;

/** Bytes to a KB, for the size of a file being written. */
const KB = 1024;

/**
 * Reads the whole lines a run's log gained after `place`, as notes, what Claude is doing now, and
 * its result. A line not yet ended is left for the next read.
 *
 * @param logFile - The path of the run's log.
 * @param place - Where the log was read to last, and what Claude was in the middle of there.
 * @param projectFolder - The project's folder, which file paths are shown relative to.
 * @returns What the log said since, and where it was read to.
 */
export function readLogNews(logFile: string, place: LogPlace, projectFolder: string): LogNews {
  const { position } = place;
  const unchanged = {
    ...place,
    notes: [],
    result: null,
    now: describeProgress(place.progress, projectFolder),
  };
  if (!existsSync(logFile)) return unchanged;
  const size = statSync(logFile).size;
  if (size <= position) return unchanged;
  const buffer = Buffer.alloc(size - position);
  const file = openSync(logFile, 'r');
  try {
    readSync(file, buffer, 0, buffer.length, position);
  } finally {
    closeSync(file);
  }
  const text = buffer.toString('utf8');
  const end = text.lastIndexOf('\n') + 1;
  const notes: string[] = [];
  let result: RunResult | null = null;
  let progress = place.progress;
  for (const line of text.slice(0, end).split('\n')) {
    const event = parseLine(line);
    if (!event || event['parent_tool_use_id']) continue;
    if (event['type'] === 'assistant') {
      if (progress.kind === 'thinking') {
        notes.push(`thought (${progress.tokens.toLocaleString('en')} tokens)`);
      }
      notes.push(...getAssistantNotes(event, projectFolder));
      progress = { kind: 'idle' };
    }
    if (event['type'] === 'system' && event['subtype'] === 'thinking_tokens') {
      progress = { kind: 'thinking', tokens: Number(event['estimated_tokens'] ?? 0) };
    }
    if (event['type'] === 'stream_event') progress = getNextProgress(progress, event['event']);
    if (event['type'] === 'result') {
      result = { text: String(event['result'] ?? ''), isError: event['is_error'] === true };
    }
  }
  return {
    notes,
    result,
    position: position + Buffer.byteLength(text.slice(0, end)),
    progress,
    now: describeProgress(progress, projectFolder),
  };
}

/**
 * Returns what Claude is in the middle of after a streamed event: a block begun, or more of one.
 *
 * @param progress - What Claude was in the middle of before the event.
 * @param streamed - The streamed event, not yet checked.
 * @returns What Claude is in the middle of now; the same progress when the event changes nothing.
 */
function getNextProgress(progress: Progress, streamed: unknown): Progress {
  if (typeof streamed !== 'object' || streamed === null || !('type' in streamed)) return progress;
  if (streamed.type === 'content_block_start' && 'content_block' in streamed) {
    const block = streamed.content_block;
    if (typeof block !== 'object' || block === null || !('type' in block)) return progress;
    if (block.type === 'text') return { kind: 'text', text: '' };
    if (block.type === 'tool_use' && 'name' in block && typeof block.name === 'string') {
      return { kind: 'tool', name: block.name, input: '' };
    }
    return progress;
  }
  if (streamed.type === 'content_block_delta' && 'delta' in streamed) {
    const delta = streamed.delta;
    if (typeof delta !== 'object' || delta === null) return progress;
    if (progress.kind === 'text' && 'text' in delta && typeof delta.text === 'string') {
      return { kind: 'text', text: progress.text + delta.text };
    }
    if (
      progress.kind === 'tool' &&
      'partial_json' in delta &&
      typeof delta.partial_json === 'string'
    ) {
      return { ...progress, input: progress.input + delta.partial_json };
    }
  }
  return progress;
}

/**
 * Describes what Claude is in the middle of in a few words.
 *
 * @param progress - What Claude is in the middle of.
 * @param projectFolder - The project's folder, which file paths are shown relative to.
 * @returns The words, or null when there is nothing to add to the notes.
 */
function describeProgress(progress: Progress, projectFolder: string): string | null {
  if (progress.kind === 'thinking') {
    return `thinking (${progress.tokens.toLocaleString('en')} tokens)`;
  }
  if (progress.kind === 'text') return progress.text.trim() ? shorten(progress.text.trim()) : null;
  if (progress.kind !== 'tool') return null;
  const path = /"file_path"\s*:\s*"([^"]*)"/.exec(progress.input)?.[1];
  const action = describeTool(progress.name, path ? { file_path: path } : {}, projectFolder);
  const size = Math.round(progress.input.length / KB);
  return size > 0 ? `${action} (${size} KB so far)` : `${action}…`;
}

function parseLine(line: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(line);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? { ...value }
      : null;
  } catch {
    return null;
  }
}

function getAssistantNotes(event: Record<string, unknown>, projectFolder: string): string[] {
  const message = event['message'];
  const content =
    typeof message === 'object' && message !== null && 'content' in message ? message.content : [];
  if (!Array.isArray(content)) return [];
  return content.flatMap((part: unknown): string[] => {
    if (typeof part !== 'object' || part === null || !('type' in part)) return [];
    if (
      part.type === 'text' &&
      'text' in part &&
      typeof part.text === 'string' &&
      part.text.trim()
    ) {
      return [shorten(part.text.trim())];
    }
    if (part.type === 'tool_use' && 'name' in part && typeof part.name === 'string') {
      const input =
        'input' in part && typeof part.input === 'object' && part.input !== null ? part.input : {};
      return [describeTool(part.name, { ...input }, projectFolder)];
    }
    return [];
  });
}

/**
 * Describes what a tool call does in a few words.
 *
 * @param name - The tool's name.
 * @param input - The tool call's input.
 * @param projectFolder - The project's folder, which file paths are shown relative to.
 * @returns The words.
 */
function describeTool(name: string, input: Record<string, unknown>, projectFolder: string): string {
  /**
   * Returns a path in the input, relative to the project folder.
   *
   * @param key - The input's field that holds the path.
   * @returns The path, or an empty string when the field is not a string.
   */
  function getPath(key: string): string {
    const value = input[key];
    return typeof value === 'string' ? relative(projectFolder, resolve(projectFolder, value)) : '';
  }
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
  if (name === 'Read') return `reading ${getPath('file_path')}`;
  if (name === 'Write') return `writing ${getPath('file_path')}`;
  if (name === 'Edit') return `editing ${getPath('file_path')}`;
  if (name === 'Grep' || name === 'Glob') return `searching ${shorten(getText('pattern'))}`;
  if (name === 'Bash') return shorten(getText('description') || getText('command'));
  if (name === 'TodoWrite') return 'planning';
  return name;
}

function shorten(text: string): string {
  const line = text.replace(/\s+/g, ' ');
  return line.length > NOTE_LENGTH ? `${line.slice(0, NOTE_LENGTH - 1)}…` : line;
}
