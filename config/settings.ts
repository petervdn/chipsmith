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
  /** The folder holding clips/, songs/ and jobs/. */
  dataFolder: string;
  /** The port the app is served on. */
  port: number;
  /** The old project's checkout (branch `archive`), for the import and the .fur writer's check. */
  archiveFolder: string;
  /** The Furnace binary that renders. */
  furnace: string;
  /** The ffmpeg binary that encodes FLAC. */
  ffmpeg: string;
  /** The Claude Code binary that composes. */
  claude: string;
  /** The Node binary that runs a job's script. */
  node: string;
};

/** The project folder: where `.env` is, and the data folder unless set. */
export const PROJECT_FOLDER = join(import.meta.dirname, '..');
const DEFAULT_PORT = 8780;
const DEFAULT_FURNACE = '/Applications/Furnace.app/Contents/MacOS/Furnace';

/** The settings from variables, each named `CHIPSMITH_<NAME>`, with the defaults for what is not set. */
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
    dataFolder: get('DATA') ?? projectFolder,
    port,
    archiveFolder: get('ARCHIVE') ?? join(projectFolder, '..', 'chiptune-archive'),
    furnace: get('FURNACE') ?? DEFAULT_FURNACE,
    ffmpeg: get('FFMPEG') ?? 'ffmpeg',
    claude: get('CLAUDE') ?? (existsSync(localClaude) ? localClaude : 'claude'),
    node: get('NODE') ?? process.execPath,
  };
}

let settings: Settings | null = null;

/** The app's settings: the environment over `.env` over the defaults, read once. */
export function getSettings(): Settings {
  settings ??= readSettings({ ...readEnvFile(), ...process.env }, PROJECT_FOLDER, homedir());
  return settings;
}

/** The variables of the project's `.env` file, or none. */
function readEnvFile(): Record<string, string | undefined> {
  const file = join(PROJECT_FOLDER, '.env');
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
}
