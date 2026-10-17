/**
 * A Claude run's log (stream-json, partial messages on) read as it grows: Claude's lines and what its
 * tools do become notes, what it is in the middle of (thinking, a line or a file being written) is
 * read as it happens, and its result ends the run. Knows nothing of how the run was started.
 */
import type { NewNote } from '../shared/job.types.ts';
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { describeThought, describeTool, shorten } from './claude-words.ts';

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
export type LogNews = LogPlace & {
  notes: NewNote[];
  result: RunResult | null;
  now: string | null;
  /** The output tokens (thinking included) of the messages Claude finished in what was read. */
  tokens: number;
  /** The output tokens of what Claude is in the middle of, as far as the log has gone (estimated). */
  nowTokens: number;
};

/** Nothing read yet. */
export const LOG_START: LogPlace = { position: 0, progress: { kind: 'idle' } };

/** How a run ended: Claude's reply, and whether it was an error. */
export type RunResult = {
  text: string;
  isError: boolean;
  /** The run's output tokens, thinking included, as its result reports them; null if it does not. */
  tokens: number | null;
};

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
    tokens: 0,
    nowTokens: getProgressTokens(place.progress),
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
  const notes: NewNote[] = [];
  let result: RunResult | null = null;
  let progress = place.progress;
  let tokens = 0;
  for (const line of text.slice(0, end).split('\n')) {
    const event = parseLine(line);
    if (!event || event['parent_tool_use_id']) continue;
    if (event['type'] === 'assistant') {
      if (progress.kind === 'thinking') {
        notes.push({ text: describeThought(getThinking(event)), tokens: progress.tokens });
      }
      const blockTokens = progress.kind === 'thinking' ? null : getProgressTokens(progress) || null;
      notes.push(
        ...getAssistantNotes(event, projectFolder).map((text, i) => ({
          text,
          tokens: i === 0 ? blockTokens : null,
        })),
      );
      progress = { kind: 'idle' };
    }
    if (event['type'] === 'system' && event['subtype'] === 'thinking_tokens') {
      progress = { kind: 'thinking', tokens: Number(event['estimated_tokens'] ?? 0) };
    }
    if (event['type'] === 'stream_event') {
      progress = getNextProgress(progress, event['event']);
      tokens += getMessageTokens(event['event']);
    }
    if (event['type'] === 'result') {
      result = {
        text: String(event['result'] ?? ''),
        isError: event['is_error'] === true,
        tokens: getOutputTokens(event['usage']),
      };
    }
  }
  return {
    notes,
    result,
    position: position + Buffer.byteLength(text.slice(0, end)),
    progress,
    now: describeProgress(progress, projectFolder),
    tokens,
    nowTokens: getProgressTokens(progress),
  };
}

/** Characters to a token, roughly, for text and tool input still streaming. */
const CHARACTERS_PER_TOKEN = 4;

/**
 * Estimates the output tokens of what Claude is in the middle of.
 *
 * @param progress - What Claude is in the middle of.
 * @returns The thinking's tokens so far, or a line's or tool input's length in tokens; 0 when idle.
 */
function getProgressTokens(progress: Progress): number {
  if (progress.kind === 'thinking') return progress.tokens;
  if (progress.kind === 'text') return Math.ceil(progress.text.length / CHARACTERS_PER_TOKEN);
  if (progress.kind === 'tool') return Math.ceil(progress.input.length / CHARACTERS_PER_TOKEN);
  return 0;
}

/**
 * Reads the output tokens a finished run's result reports, for a job made before they were kept.
 *
 * @param logFile - The run's log.
 * @returns The tokens, or null when the log has no result with them.
 */
export function readRunTokens(logFile: string): number | null {
  if (!existsSync(logFile)) return null;
  const resultLine = readFileSync(logFile, 'utf8')
    .split('\n')
    .filter((line) => line.includes('"type":"result"'))
    .at(-1);
  const event = resultLine ? parseLine(resultLine) : null;
  return event ? getOutputTokens(event['usage']) : null;
}

/**
 * Returns the output tokens a streamed event says a message ended with.
 *
 * @param streamed - The streamed event, not yet checked.
 * @returns The message's output tokens on its message_delta, else 0.
 */
function getMessageTokens(streamed: unknown): number {
  if (typeof streamed !== 'object' || streamed === null || !('type' in streamed)) return 0;
  if (streamed.type !== 'message_delta' || !('usage' in streamed)) return 0;
  return getOutputTokens(streamed.usage) ?? 0;
}

/**
 * Returns the output tokens of a usage.
 *
 * @param usage - The usage, not yet checked.
 * @returns Its output_tokens, or null when it has none.
 */
function getOutputTokens(usage: unknown): number | null {
  if (typeof usage !== 'object' || usage === null || !('output_tokens' in usage)) return null;
  return typeof usage.output_tokens === 'number' ? usage.output_tokens : null;
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
  const skill = /"skill"\s*:\s*"([^"]*)"/.exec(progress.input)?.[1];
  const known = { ...(path ? { file_path: path } : {}), ...(skill ? { skill } : {}) };
  const action = describeTool(progress.name, known, projectFolder);
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

/**
 * Returns the text of the thinking in an assistant message.
 *
 * @param event - The assistant event.
 * @returns The thinking's text, or an empty string when it has none (the log often leaves it out).
 */
function getThinking(event: Record<string, unknown>): string {
  const message = event['message'];
  const content =
    typeof message === 'object' && message !== null && 'content' in message ? message.content : [];
  if (!Array.isArray(content)) return '';
  return content
    .map((part: unknown) =>
      typeof part === 'object' &&
      part !== null &&
      'thinking' in part &&
      typeof part.thinking === 'string'
        ? part.thinking
        : '',
    )
    .join(' ');
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
