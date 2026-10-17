/**
 * Bringing songs of the old batches in from the archive (branch `archive`, checked out beside this
 * project): each .fur becomes a song of one whole clip, tagged with its thread and `archive`.
 * Run: `node make/import-archive.ts --favorites` (the user's thumbs-up, as keepers) or with .fur files.
 */
import { readFileSync } from 'node:fs';
import { getSettings } from '../config/settings.ts';
import { basename, dirname, join, relative } from 'node:path';
import type { Tag } from '../shared/catalogue.types.ts';
import { readModule } from '../fur/read.ts';
import { makeSong } from './make-song.ts';

const { archiveFolder: ARCHIVE_FOLDER, dataFolder, port } = getSettings();

/** The thread of each old batch, by its number. */
const THREADS: { from: number; to: number; tag: string }[] = [
  { from: 0, to: 5, tag: 'action' },
  { from: 6, to: 13, tag: 'slow-chords' },
  { from: 14, to: 14, tag: 'heroic' },
  { from: 15, to: 15, tag: 'slow-chords' },
  { from: 16, to: 17, tag: 'tide' },
  { from: 18, to: 18, tag: 'fugue' },
  { from: 19, to: 19, tag: 'tide' },
  { from: 20, to: 20, tag: 'fugue' },
  { from: 21, to: 21, tag: 'tide' },
  { from: 22, to: 22, tag: 'fugue' },
  { from: 23, to: 23, tag: 'tide' },
  { from: 24, to: 24, tag: 'fugue' },
  { from: 25, to: 26, tag: 'nes-groove' },
  { from: 27, to: 27, tag: 'fugue' },
  { from: 28, to: 29, tag: 'boombap' },
  { from: 30, to: 35, tag: 'funk' },
  { from: 36, to: 37, tag: 'fugue' },
];

/** The tags of a song from an old batch folder: its thread and `archive`. */
export function getArchiveTags(batchFolder: string): Tag[] {
  const number = Number(/^(\d+)-/.exec(batchFolder)?.[1] ?? -1);
  const thread = THREADS.find(({ from, to }) => number >= from && number <= to);
  const tags: Tag[] = [{ name: 'archive', by: 'claude' }];
  if (thread) tags.unshift({ name: thread.tag, by: 'claude' });
  return tags;
}

/** The .fur files of the user's thumbs-up, from the archive's favorites.json. */
function getFavoriteFiles(): string[] {
  const favorites: unknown = JSON.parse(
    readFileSync(join(ARCHIVE_FOLDER, 'furnace', 'favorites.json'), 'utf8'),
  );
  const names = Array.isArray(favorites) ? favorites : [];
  return names
    .filter((name): name is string => typeof name === 'string')
    .map((mp3) => join(ARCHIVE_FOLDER, 'furnace', mp3.replace(/\.mp3$/, '.fur')));
}

async function importFiles(furFiles: string[], isFavorite: boolean): Promise<void> {
  const promptId = `import-${new Date().toISOString().slice(0, 10)}`;
  for (const furFile of furFiles) {
    const batchFolder = basename(dirname(furFile));
    const path = relative(ARCHIVE_FOLDER, furFile);
    const module = readModule(readFileSync(furFile));
    const made = await makeSong({
      root: dataFolder,
      title: module.song.name || basename(furFile, '.fur'),
      module,
      prompt: `Imported from the archive: ${path} (batch ${batchFolder}).`,
      promptId,
      scriptFile: import.meta.filename,
      tags: getArchiveTags(batchFolder),
      status: isFavorite ? 'keeper' : 'new',
      key: null,
      promptedFrom: null,
    });
    console.log(`${made.songId} ${made.clipId}  ${path}`);
  }
  await fetch(`http://localhost:${port}/api/rescan`, { method: 'POST' }).catch(() => {
    console.log('the server did not answer; it reads the new songs when it starts');
  });
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const isFavorite = args.includes('--favorites');
  const files = isFavorite ? getFavoriteFiles() : args.filter((arg) => arg.endsWith('.fur'));
  await importFiles(files, isFavorite);
}
