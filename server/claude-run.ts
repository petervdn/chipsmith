/**
 * Claude Code run headless for a job: `claude -p` in the project folder, detached, its stream-json
 * output written to the job's claude.log, so a server restart does not stop it. The log is read as it
 * grows: Claude's lines and what its tools do become notes, and its result ends the run.
 */
import { spawn } from 'node:child_process';
import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve } from 'node:path';

/** What a run's log has said since it was last read. */
export type LogNews = { notes: string[]; result: RunResult | null; position: number };

/** How a run ended: Claude's reply, and whether it was an error. */
export type RunResult = { text: string; isError: boolean };

/** The longest note kept from a line of Claude's. */
const NOTE_LENGTH = 200;

/** Starts Claude on a prompt; its output goes to `logFile`. */
export function startClaude({
  projectFolder,
  prompt,
  systemPrompt,
  allowedTools,
  logFile,
}: {
  projectFolder: string;
  prompt: string;
  systemPrompt: string;
  allowedTools: string[];
  logFile: string;
}): number | undefined {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--permission-mode',
    'dontAsk',
    '--allowedTools',
    ...allowedTools,
    '--append-system-prompt',
    systemPrompt,
  ];
  const out = openSync(logFile, 'a');
  try {
    const child = spawn(findClaude(), args, {
      cwd: projectFolder,
      detached: true,
      stdio: ['ignore', out, out],
      env: getCleanEnvironment(),
    });
    child.unref();
    return child.pid;
  } finally {
    closeSync(out);
  }
}

/** The whole lines a run's log gained after `position`, as notes and, at the end, its result. */
export function readLogNews(logFile: string, position: number, projectFolder: string): LogNews {
  if (!existsSync(logFile)) return { notes: [], result: null, position };
  const size = statSync(logFile).size;
  if (size <= position) return { notes: [], result: null, position };
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
  for (const line of text.slice(0, end).split('\n')) {
    const event = parseLine(line);
    if (!event) continue;
    if (event['type'] === 'assistant' && !event['parent_tool_use_id']) {
      notes.push(...getAssistantNotes(event, projectFolder));
    }
    if (event['type'] === 'result') {
      result = { text: String(event['result'] ?? ''), isError: event['is_error'] === true };
    }
  }
  return { notes, result, position: position + Buffer.byteLength(text.slice(0, end)) };
}

/** Whether a process still runs. */
export function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
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

/** What a tool call does, in a few words. */
function describeTool(name: string, input: Record<string, unknown>, projectFolder: string): string {
  function getPath(key: string): string {
    const value = input[key];
    return typeof value === 'string' ? relative(projectFolder, resolve(projectFolder, value)) : '';
  }
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

function findClaude(): string {
  const local = join(homedir(), '.local', 'bin', 'claude');
  return existsSync(local) ? local : 'claude';
}

/** The environment without the variables of the Claude Code session the server may run inside. */
function getCleanEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !/^(CLAUDE|ANTHROPIC_|AI_AGENT$|BAGGAGE$|__CFBundle)/.test(name),
    ),
  );
}
