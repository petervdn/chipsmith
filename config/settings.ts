/**
 * The app's settings, in one place: where its data is, the port, and the programs it calls (Furnace,
 * ffmpeg, Claude Code, Node). Each comes from an environment variable `CHIPSMITH_…`, else from a
 * `.env` file in the project folder (not in git; `.env.example` lists them), else its default. A
 * variable set in the shell wins over the file. No other module reads a setting from `process.env`
 * (server/claude-run.ts only hands the environment on to Claude Code).
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/** What the app is set to. */
export type Settings = {
  /** The folder holding clips/, songs/ and jobs/: what is made here, never in git. */
  dataFolder: string;
  /** The port the app is served on. */
  port: number;
  /** The Furnace binary that renders: a headless build, or the app's own. */
  furnace: string;
  /** The Furnace app that opens a clip's .fur to look at. */
  furnaceApp: string;
  /** The ffmpeg binary that encodes FLAC. */
  ffmpeg: string;
  /** The Claude Code binary that composes. */
  claude: string;
  /** The Node binary that runs a job's script. */
  node: string;
};

/** The project folder: where `.env` is, and the code Claude Code and a job's script run in. */
export const PROJECT_FOLDER = join(import.meta.dirname, '..');
/** The data folder unless set, under the project folder (out of git). */
const DEFAULT_DATA_FOLDER = 'data';
/** The default port: 6502, after the processor of the NES, the Commodore 64 and the Apple II. */
const DEFAULT_PORT = 6502;
/** The Furnace app's binary: it renders unless a headless build is set, and opens files to look at. */
const DEFAULT_FURNACE = '/Applications/Furnace.app/Contents/MacOS/Furnace';

/**
 * Reads the settings from variables, each named `CHIPSMITH_<NAME>`, with the defaults for what is
 * not set. A variable that is empty or only spaces counts as not set. Throws if the port is not a
 * positive whole number.
 *
 * @param variables - The variables, by name.
 * @param projectFolder - The project folder, under which the data folder is by default.
 * @param home - The user's home folder, where `.local/bin/claude` is looked for.
 * @returns The settings.
 */
export function readSettings(
  variables: Record<string, string | undefined>,
  projectFolder: string,
  home: string,
): Settings {
  function get(name: string): string | undefined {
    const value = variables[`CHIPSMITH_${name}`]?.trim();
    return value ? value : undefined;
  }
  const localClaude = join(home, '.local', 'bin', 'claude');
  const port = Number(get('PORT') ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`CHIPSMITH_PORT is not a port: ${get('PORT')}`);
  }
  return {
    dataFolder: get('DATA') ?? join(projectFolder, DEFAULT_DATA_FOLDER),
    port,
    furnace: get('FURNACE') ?? DEFAULT_FURNACE,
    furnaceApp: get('FURNACE_APP') ?? DEFAULT_FURNACE,
    ffmpeg: get('FFMPEG') ?? 'ffmpeg',
    claude: get('CLAUDE') ?? (existsSync(localClaude) ? localClaude : 'claude'),
    node: get('NODE') ?? process.execPath,
  };
}

let settings: Settings | null = null;

/**
 * Returns the app's settings: the environment over `.env` over the defaults, read once.
 *
 * @returns The settings.
 */
export function getSettings(): Settings {
  settings ??= readSettings({ ...readEnvFile(), ...process.env }, PROJECT_FOLDER, homedir());
  return settings;
}

/**
 * Reads the variables of the project's `.env` file.
 *
 * @returns The variables by name; none if there is no `.env` file.
 */
function readEnvFile(): Record<string, string | undefined> {
  const file = join(PROJECT_FOLDER, '.env');
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
}
