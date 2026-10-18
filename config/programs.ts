/**
 * The programs the app calls, checked: whether each can be run, and its version, read from the
 * program itself. Furnace's version is what a clip records as rendered by (render/render-clip.ts).
 */
import { spawn } from 'node:child_process';
import type { ProgramCheck, ProgramName } from '../shared/api.types.ts';
import type { Settings } from './settings.ts';
import { getSettings } from './settings.ts';

/** How Furnace names its version, the app and a headless build alike. */
const FURNACE_VERSION = /Furnace version ([\d.]*\d)/;
/** How each program is asked for its version, what reads the version from its answer, and its use. */
const PROGRAMS = {
  furnace: {
    args: ['-version'],
    pattern: FURNACE_VERSION,
    variable: 'CHIPSMITH_FURNACE',
    neededFor: 'rendering songs',
  },
  furnaceApp: {
    args: ['-version'],
    pattern: FURNACE_VERSION,
    variable: 'CHIPSMITH_FURNACE_APP',
    neededFor: "opening a clip's .fur",
  },
  ffmpeg: {
    args: ['-version'],
    pattern: /ffmpeg version (\S+)/,
    variable: 'CHIPSMITH_FFMPEG',
    neededFor: 'encoding renders as FLAC',
  },
  claude: {
    args: ['--version'],
    pattern: /^(\S+) \(Claude Code\)/m,
    variable: 'CHIPSMITH_CLAUDE',
    neededFor: 'composing from prompts',
  },
  node: {
    args: ['--version'],
    pattern: /^v(\S+)/m,
    variable: 'CHIPSMITH_NODE',
    neededFor: "running a job's script",
  },
} satisfies Record<
  ProgramName,
  { args: string[]; pattern: RegExp; variable: string; neededFor: string }
>;
/** Milliseconds a program has to answer. */
const ANSWER_TIME = 15000;
const PROGRAM_NAMES: ProgramName[] = ['furnace', 'furnaceApp', 'ffmpeg', 'claude', 'node'];

let furnaceVersion: Promise<string> | null = null;

/**
 * Checks every program the settings name: whether it runs, and its version.
 *
 * @param settings - The settings, which name the path of each program.
 * @returns A check per program, in the order furnace, furnaceApp, ffmpeg, claude, node.
 */
export function checkPrograms(settings: Settings): Promise<ProgramCheck[]> {
  return Promise.all(PROGRAM_NAMES.map((name) => checkProgram(name, settings[name])));
}

/**
 * Returns the version of the Furnace that renders, read from it once. A read that fails is not
 * kept, so the next call asks again.
 *
 * @returns The version, such as "0.6.8.3"; rejects if it could not be read.
 */
export function getFurnaceVersion(): Promise<string> {
  furnaceVersion ??= checkProgram('furnace', getSettings().furnace).then(({ version, error }) => {
    if (version) return version;
    furnaceVersion = null;
    throw new Error(`Furnace's version could not be read: ${error ?? 'no version in its answer'}`);
  });
  return furnaceVersion;
}

/**
 * Reads the version a program's answer names.
 *
 * @param name - The program, which says how its answer names its version.
 * @param answer - What the program printed when asked for its version.
 * @returns The version, or null if the answer names none.
 */
export function readVersion(name: ProgramName, answer: string): string | null {
  return PROGRAMS[name].pattern.exec(answer)?.[1] ?? null;
}

async function checkProgram(name: ProgramName, path: string): Promise<ProgramCheck> {
  const { args, variable, neededFor } = PROGRAMS[name];
  const checkedAt = new Date().toISOString();
  try {
    const version = readVersion(name, await runForAnswer(path, args));
    return version
      ? { name, path, variable, neededFor, version, error: null, checkedAt }
      : {
          name,
          path,
          variable,
          neededFor,
          version: null,
          error: 'it ran, but did not name its version',
          checkedAt,
        };
  } catch (error) {
    return {
      name,
      path,
      variable,
      neededFor,
      version: null,
      error: error instanceof Error ? error.message : String(error),
      checkedAt,
    };
  }
}

/**
 * Runs a program and returns what it prints (both streams), once it has exited. It is given
 * `ANSWER_TIME` milliseconds to answer.
 *
 * @param path - The program's path.
 * @param args - The arguments it is run with.
 * @returns What it printed; rejects with "not found" if there is no such program.
 */
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
