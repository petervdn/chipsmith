/**
 * Claude Code run headless for a job: `claude -p` in the project folder, detached, its stream-json
 * output (partial messages on) written to the job's claude.log, so a server restart does not stop it.
 * The log is read by claude-log.ts.
 */
import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { getSettings } from '../config/settings.ts';

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
    '--include-partial-messages',
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

/** Whether a process still runs. */
export function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** The environment without the variables of the Claude Code session the server may run inside. */
function getCleanEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !/^(CLAUDE|ANTHROPIC_|AI_AGENT$|BAGGAGE$|__CFBundle)/.test(name),
    ),
  );
}
