/**
 * The check of the port (docs/adr/0002): every .fur the Python writer made, in the archive's
 * checkout beside this project, is read with fur/read.ts and written again with fur/write.ts; the
 * uncompressed bytes must be the same. Run: `node fur/check-archive.ts [archive folder]`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getUncompressed, readModule } from './read.ts';
import { getModuleBytes } from './write.ts';

/** Where the archive is checked out, beside this project. */
const ARCHIVE = join(import.meta.dirname, '..', '..', 'chiptune-archive');
/** Folders of the archive that hold .fur files the Python writer made. */
const WRITTEN_BY_PYTHON = ['furnace', 'editor'];

/** Every .fur file under a folder. */
function findFurFiles(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return findFurFiles(path);
    return name.endsWith('.fur') ? [path] : [];
  });
}

/** The first position where two byte arrays differ, or -1 when they are the same. */
function findDifference(first: Uint8Array, second: Uint8Array): number {
  const length = Math.max(first.length, second.length);
  for (let i = 0; i < length; i++) if (first[i] !== second[i]) return i;
  return -1;
}

const archive = process.argv[2] ?? ARCHIVE;
const files = WRITTEN_BY_PYTHON.flatMap((folder) => findFurFiles(join(archive, folder)));
const failures: string[] = [];
for (const file of files) {
  try {
    const original = getUncompressed(readFileSync(file));
    const written = getModuleBytes(readModule(original));
    const at = findDifference(original, written);
    if (at >= 0) failures.push(`${file}: differs at byte ${at}`);
  } catch (error) {
    failures.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(
  `${files.length - failures.length} of ${files.length} files written back byte for byte`,
);
for (const failure of failures.slice(0, 20)) console.log(`  ${failure}`);
if (failures.length > 0) process.exitCode = 1;
