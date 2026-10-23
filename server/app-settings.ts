/**
 * The app's settings in the data folder (settings.json): read when asked for, so a change is seen by
 * the next job, and written whole when changed. Knows nothing of the routes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AppSettingsChange } from '../shared/api-requests.schema.ts';
import type { AppSettings } from '../shared/app-settings.schema.ts';
import { appSettingsSchema } from '../shared/app-settings.schema.ts';
import { parseChecked } from '../shared/schema-parse.ts';
import { writeJsonAtomically } from './store.ts';

const SETTINGS_FILE = 'settings.json';

/**
 * Reads the app's settings; a data folder without the file has every setting at its default.
 *
 * @param root - The data folder.
 * @returns The settings.
 */
export function getAppSettings(root: string): AppSettings {
  const file = join(root, SETTINGS_FILE);
  const saved: unknown = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  return parseChecked(appSettingsSchema, saved, SETTINGS_FILE);
}

/**
 * Changes the settings a change names and writes them all to the file.
 *
 * @param root - The data folder.
 * @param change - The settings changed.
 * @returns The settings as they are now.
 */
export function changeAppSettings(root: string, change: AppSettingsChange): AppSettings {
  const settings = { ...getAppSettings(root), ...change };
  writeJsonAtomically(join(root, SETTINGS_FILE), settings);
  return settings;
}
