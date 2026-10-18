/**
 * The references in memory, each in `references/<id>/` (reference.json, source.fur, source.txt,
 * audio.flac and channels/<nn>.flac): read when the server starts or is asked to look again, listed
 * with the facts read from their files, and their notes written. Knows nothing of HTTP.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { ReferenceListing } from '../shared/api.types.ts';
import type { Reference } from '../shared/reference.schema.ts';
import { getChannelNames, getChipFamily, getChipLabels } from '../fur/demo-chips.ts';
import { readFurnaceText } from '../fur/furnace-text.ts';
import { REFERENCE_IDS } from '../make/ids.ts';
import { readFlacSeconds } from '../render/flac.ts';
import { getObject, getString } from './json-checks.ts';
import { writeJsonAtomically } from './store.ts';

/** The references by id, with what is read from their files, and the data folder they are in. */
export type ReferenceStore = { root: string; references: Map<string, ReferenceListing> };

const REFERENCE_FILE = 'reference.json';

/**
 * Reads every reference under `root`/references. One that does not read is reported in the
 * server's log and left; a folder without its reference.json is one still being imported.
 *
 * @param root - The data folder.
 * @returns The references read.
 */
export function openReferences(root: string): ReferenceStore {
  const store: ReferenceStore = { root, references: new Map() };
  rescanReferences(store);
  return store;
}

/**
 * Reads the references again, for those imported since.
 *
 * @param store - The references in memory, replaced by what is on disk.
 */
export function rescanReferences(store: ReferenceStore): void {
  store.references.clear();
  const folder = join(store.root, REFERENCE_IDS.folder);
  if (!existsSync(folder)) return;
  for (const id of readdirSync(folder)) {
    const file = join(folder, id, REFERENCE_FILE);
    if (!existsSync(file)) continue;
    try {
      const reference = checkReference(JSON.parse(readFileSync(file, 'utf8')), file);
      store.references.set(reference.id, getListing(store, reference));
    } catch (error) {
      console.warn(`unreadable ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Lists the references, by name.
 *
 * @param store - The references in memory.
 * @returns The references with their facts.
 */
export function listReferences(store: ReferenceStore): ReferenceListing[] {
  return [...store.references.values()].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

/**
 * Writes what the user writes of a reference.
 *
 * @param store - The references in memory.
 * @param referenceId - The reference's id; an unknown id is an error.
 * @param notes - The notes, which replace those before.
 * @returns The reference changed, with its facts.
 */
export function saveReferenceNotes(
  store: ReferenceStore,
  referenceId: string,
  notes: string,
): ReferenceListing {
  const listing = store.references.get(referenceId);
  if (!listing) throw new Error(`no reference ${referenceId}`);
  const reference: Reference = { ...listing.reference, notes };
  writeJsonAtomically(join(getReferenceFolder(store, referenceId), REFERENCE_FILE), reference);
  const changed = { ...listing, reference };
  store.references.set(referenceId, changed);
  return changed;
}

/**
 * Returns the folder of a reference's files.
 *
 * @param store - The references in memory.
 * @param referenceId - The reference's id.
 * @returns The folder.
 */
export function getReferenceFolder(store: ReferenceStore, referenceId: string): string {
  return join(store.root, REFERENCE_IDS.folder, referenceId);
}

/**
 * Returns a reference with the facts read from its files: its text export and its audio.
 *
 * @param store - The references in memory.
 * @param reference - The reference's record.
 * @returns The reference with its facts.
 */
function getListing(store: ReferenceStore, reference: Reference): ReferenceListing {
  const folder = getReferenceFolder(store, reference.id);
  const textFile = join(folder, 'source.txt');
  const facts = readFurnaceText(existsSync(textFile) ? readFileSync(textFile, 'utf8') : '');
  return {
    reference,
    name: facts.name || basename(reference.file, '.fur'),
    author: facts.author,
    album: facts.album,
    chips: getChipLabels(facts.chips),
    family: getChipFamily(facts.chips),
    channels: getChannelNames(facts.chips) ?? [],
    subsongCount: facts.subsongCount,
    seconds: readFlacSeconds(join(folder, 'audio.flac')),
  };
}

/**
 * Checks a reference.json, field by field.
 *
 * @param value - The file's value, not yet checked.
 * @param path - The file, for the error.
 * @returns The reference.
 */
function checkReference(value: unknown, path: string): Reference {
  const object = getObject(value, path);
  return {
    id: getString(object['id'], `${path}: id`),
    file: getString(object['file'], `${path}: file`),
    imported: getString(object['imported'], `${path}: imported`),
    notes: getString(object['notes'], `${path}: notes`),
  };
}
