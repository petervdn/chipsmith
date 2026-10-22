/**
 * Claude Code run headless for a job: `claude -p` in the project folder, detached, its stream-json
 * output (partial messages on) written to the job's claude.log, so a server restart does not stop it.
 * The log is read by claude-log.ts.
 */
import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { getSettings } from '../config/settings.ts';

/**
 * Starts Claude on a prompt, detached, with its output appended to `logFile`.
 *
 * @param run - What Claude is run with.
 * @param run.projectFolder - The folder Claude runs in.
 * @param run.prompt - The prompt.
 * @param run.systemPrompt - What is added to Claude's system prompt.
 * @param run.allowedTools - The tools Claude may use without asking.
 * @param run.model - The model Claude runs with, as `--model` names it.
 * @param run.logFile - The file Claude's stream-json output is appended to.
 * @returns The process id of Claude, or undefined when it did not start.
 */
export function startClaude({
  projectFolder,
  prompt,
  systemPrompt,
  allowedTools,
  model,
  logFile,
}: {
  projectFolder: string;
  prompt: string;
  systemPrompt: string;
  allowedTools: string[];
  model: string;
  logFile: string;
}): number | undefined {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--model',
    model,
    '--permission-mode',
    'dontAsk',
    '--allowedTools',
    ...allowedTools,
    '--append-system-prompt',
    systemPrompt,
  ];
  const out = openSync(logFile, 'a');
  try {
    const child = spawn(getSettings().claude, args, {
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

/**
 * Stops a Claude run and what it started (its process group, as it runs detached).
 *
 * @param pid - The process id of Claude.
 */
export function stopClaude(pid: number): void {
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* it has stopped already */
    }
  }
}

/**
 * Tells whether a process still runs.
 *
 * @param pid - The process's id.
 * @returns Whether it runs.
 */
export function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the server's environment without the variables of the Claude Code session the server may
 * run inside.
 *
 * @returns The environment to start Claude with.
 */
function getCleanEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !/^(CLAUDE|ANTHROPIC_|AI_AGENT$|BAGGAGE$|__CFBundle)/.test(name),
    ),
  );
}
