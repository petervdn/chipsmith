/**
 * Imports Furnace's demo songs (`references/furnace/demos/`) as references in the data folder:
 * those whose chips are all ones a reference may play on and that play on the NES, the SID or the
 * SCC. Each gets its folder (`references/r0001/`): the .fur copied, Furnace's text export of it,
 * its first subsong rendered once through as a mix and per channel, and reference.json, written
 * last, so a folder without it is one that failed or is under way. A demo imported before is left.
 * Run: `npm run import-references`; the server is asked to look again when it is done.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { PROJECT_FOLDER, getSettings } from '../config/settings.ts';
import { getChannelNames, getChipFamily } from '../fur/demo-chips.ts';
import { readFurnaceText } from '../fur/furnace-text.ts';
import { encodeFlac } from '../render/flac.ts';
import { exportText, renderChannelsToWav, renderToWav } from '../render/furnace.ts';
import { writeJsonAtomically } from '../server/store.ts';
import type { Reference } from '../shared/reference.types.ts';
import { REFERENCE_IDS, claimId } from './ids.ts';

/** Where Furnace's demo songs are, in the project. */
const DEMOS_FOLDER = join(PROJECT_FOLDER, 'references', 'furnace', 'demos');

/** The digits of a channel's number in its file's name (`01.flac`), as Furnace numbers them too. */
const CHANNEL_DIGITS = 2;

async function importReferences(root: string): Promise<void> {
  const imported = new Set(readImportedFiles(root));
  let count = 0;
  for (const furFile of findFurFiles(DEMOS_FOLDER)) {
    const file = relative(PROJECT_FOLDER, furFile);
    if (imported.has(file)) continue;
    const temporaryFolder = mkdtempSync(join(tmpdir(), 'chiptune-reference-'));
    try {
      const textFile = join(temporaryFolder, 'source.txt');
      await exportText(furFile, textFile);
      const text = readFileSync(textFile, 'utf8');
      const reason = getSkipReason(text);
      if (reason) {
        console.log(`left ${file}: ${reason}`);
        continue;
      }
      await importReference(root, furFile, file, textFile, temporaryFolder);
      count += 1;
    } catch (error) {
      console.warn(`failed ${file}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      rmSync(temporaryFolder, { recursive: true, force: true });
    }
  }
  console.log(`${count} imported`);
}

/**
 * Returns why a demo is not imported, from its text export.
 *
 * @param text - The demo's text export.
 * @returns The reason, or null for a demo to import.
 */
function getSkipReason(text: string): string | null {
  const { chips, channelCount } = readFurnaceText(text);
  const names = getChannelNames(chips);
  if (!names) return `a chip without a reference's channels (${chips.join(', ')})`;
  if (!getChipFamily(chips)) return `not on the NES, the SID or the SCC (${chips.join(', ')})`;
  if (names.length !== channelCount) return `${channelCount} channels, not ${names.length}`;
  return null;
}

async function importReference(
  root: string,
  furFile: string,
  file: string,
  textFile: string,
  temporaryFolder: string,
): Promise<void> {
  const referenceId = claimId(root, REFERENCE_IDS);
  const folder = join(root, REFERENCE_IDS.folder, referenceId);
  try {
    copyFileSync(furFile, join(folder, 'source.fur'));
    copyFileSync(textFile, join(folder, 'source.txt'));
    const mixFile = join(temporaryFolder, 'mix.wav');
    await renderToWav(furFile, mixFile);
    await encodeFlac(mixFile, join(folder, 'audio.flac'));
    const channelCount = readFurnaceText(readFileSync(textFile, 'utf8')).channelCount;
    await renderChannelsToWav(furFile, join(temporaryFolder, 'channel.wav'));
    mkdirSync(join(folder, 'channels'));
    for (let channel = 1; channel <= channelCount; channel++) {
      const number = String(channel).padStart(CHANNEL_DIGITS, '0');
      await encodeFlac(
        join(temporaryFolder, `channel_c${number}.wav`),
        join(folder, 'channels', `${number}.flac`),
      );
    }
    const reference: Reference = {
      id: referenceId,
      file,
      imported: new Date().toISOString(),
      notes: '',
    };
    writeJsonAtomically(join(folder, 'reference.json'), reference);
    console.log(`${referenceId} ${file}`);
  } catch (error) {
    rmSync(folder, { recursive: true, force: true });
    throw error;
  }
}

/**
 * Returns the demos imported before, by the file each was copied from.
 *
 * @param root - The data folder.
 * @returns The files, relative to the project.
 */
function readImportedFiles(root: string): string[] {
  const folder = join(root, REFERENCE_IDS.folder);
  if (!existsSync(folder)) return [];
  return readdirSync(folder).flatMap((referenceId) => {
    const file = join(folder, referenceId, 'reference.json');
    if (!existsSync(file)) return [];
    const reference: unknown = JSON.parse(readFileSync(file, 'utf8'));
    const origin =
      typeof reference === 'object' && reference !== null && 'file' in reference
        ? reference.file
        : null;
    return typeof origin === 'string' ? [origin] : [];
  });
}

/**
 * Returns every .fur under a folder, its subfolders too, sorted.
 *
 * @param folder - The folder.
 * @returns The paths of the .fur files.
 */
function findFurFiles(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.fur'))
    .sort()
    .map((name) => join(folder, name));
}

/**
 * Asks the server, if it runs, to read the references again.
 *
 * @param port - The server's port.
 */
async function askServerToLookAgain(port: number): Promise<void> {
  try {
    await fetch(`http://localhost:${port}/api/rescan`, { method: 'POST' });
  } catch {
    /* the server is not running; it reads the references when it starts */
  }
}

if (import.meta.main) {
  const { dataFolder, port } = getSettings();
  await importReferences(dataFolder);
  await askServerToLookAgain(port);
}
