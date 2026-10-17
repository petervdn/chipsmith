/**
 * The programs the app calls, checked: whether each can be run, and its version, read from the
 * program itself. Furnace's version is what a clip records as rendered by (render/render-clip.ts).
 */
import { spawn } from 'node:child_process';
import type { ProgramCheck, ProgramName } from '../shared/api.types.ts';
import type { Settings } from './settings.ts';
import { getSettings } from './settings.ts';

/** How each program is asked for its version, what reads the version from its answer, and its use. */
const PROGRAMS = {
  furnace: {
    args: ['-version'],
    pattern: /Furnace version ([\d.]*\d)/,
    neededFor: 'rendering songs',
  },
  ffmpeg: {
    args: ['-version'],
    pattern: /ffmpeg version (\S+)/,
    neededFor: 'encoding renders as FLAC',
  },
  claude: {
    args: ['--version'],
    pattern: /^(\S+) \(Claude Code\)/m,
    neededFor: 'composing from prompts',
  },
  node: { args: ['--version'], pattern: /^v(\S+)/m, neededFor: "running a job's script" },
} satisfies Record<ProgramName, { args: string[]; pattern: RegExp; neededFor: string }>;
/** Milliseconds a program has to answer. */
const ANSWER_TIME = 15000;
const PROGRAM_NAMES: ProgramName[] = ['furnace', 'ffmpeg', 'claude', 'node'];

let furnaceVersion: Promise<string> | null = null;

/** Checks every program the settings name. */
export function checkPrograms(settings: Settings): Promise<ProgramCheck[]> {
  return Promise.all(PROGRAM_NAMES.map((name) => checkProgram(name, settings[name])));
}

/** The version of the Furnace that renders, read from it once. */
export function getFurnaceVersion(): Promise<string> {
  furnaceVersion ??= checkProgram('furnace', getSettings().furnace).then(({ version, error }) => {
    if (version) return version;
    furnaceVersion = null;
    throw new Error(`Furnace's version could not be read: ${error ?? 'no version in its answer'}`);
  });
  return furnaceVersion;
}

/** The version a program's answer names, or null. */
export function readVersion(name: ProgramName, answer: string): string | null {
  return PROGRAMS[name].pattern.exec(answer)?.[1] ?? null;
}

async function checkProgram(name: ProgramName, path: string): Promise<ProgramCheck> {
  const { args, neededFor } = PROGRAMS[name];
  try {
    const version = readVersion(name, await runForAnswer(path, args));
    return version
      ? { name, path, neededFor, version, error: null }
      : { name, path, neededFor, version: null, error: 'it ran, but did not name its version' };
  } catch (error) {
    return {
      name,
      path,
      neededFor,
      version: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** What a program prints (both streams), once it has exited. */
function runForAnswer(path: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const program = spawn(path, args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: ANSWER_TIME });
    let answer = '';
    program.stdout.on('data', (chunk: Buffer) => (answer += chunk.toString()));
    program.stderr.on('data', (chunk: Buffer) => (answer += chunk.toString()));
    program.on('error', (error: NodeJS.ErrnoException) =>
      reject(new Error(error.code === 'ENOENT' ? 'not found' : error.message)),
    );
    program.on('close', () => resolve(answer));
  });
}
