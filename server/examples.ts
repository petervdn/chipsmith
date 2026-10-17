/**
 * The example songs (examples/, in git) copied into a data folder that has no clips and no songs yet,
 * so a fresh checkout starts with something to play. Their audio is rendered like any missing audio
 * (server/missing-audio.ts). Knows nothing of the store or of HTTP.
 */
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** The folders of the data that the examples fill. */
const FILLED_FOLDERS = ['clips', 'songs'];

/** Copies the examples into `dataFolder` when it holds no clips and no songs; says whether it did. */
export function copyExamplesIfEmpty(dataFolder: string, examplesFolder: string): boolean {
  if (FILLED_FOLDERS.some((folder) => hasEntries(join(dataFolder, folder)))) return false;
  for (const folder of FILLED_FOLDERS) {
    const examples = join(examplesFolder, folder);
    if (existsSync(examples)) cpSync(examples, join(dataFolder, folder), { recursive: true });
  }
  return true;
}

function hasEntries(folder: string): boolean {
  return existsSync(folder) && readdirSync(folder).length > 0;
}
