/**
 * The saved structures (a song's form, sent with a prompt when chosen), in memory and each in
 * `structures/<id>/structure.json`: listed, made, changed and deleted. What was sent with a prompt is a
 * copy, which a later change leaves alone. Knows nothing of HTTP.
 */
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Structure, StructureDraft } from '../shared/structure.schema.ts';
import { STRUCTURE_IDS, claimId } from '../make/ids.ts';
import { checkStructure } from './structure-checks.ts';
import { writeJsonAtomically } from './store.ts';

/** The structures, by id, and the data folder they are kept in. */
export type StructureStore = { root: string; structures: Map<string, Structure> };

const STRUCTURE_FILE = 'structure.json';

/**
 * Reads every structure under the data folder; a file that does not read is reported and left.
 *
 * @param root - The data folder.
 * @returns The structures.
 */
export function openStructures(root: string): StructureStore {
  const store: StructureStore = { root, structures: new Map() };
  const folder = join(root, STRUCTURE_IDS.folder);
  if (!existsSync(folder)) return store;
  for (const id of readdirSync(folder)) {
    const file = join(folder, id, STRUCTURE_FILE);
    if (!existsSync(file)) continue;
    try {
      const structure = checkStructure(JSON.parse(readFileSync(file, 'utf8')), file);
      store.structures.set(structure.id, structure);
    } catch (error) {
      console.warn(`unreadable ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return store;
}

/**
 * Lists the structures, sorted by name.
 *
 * @param store - The structures in memory.
 * @returns The structures.
 */
export function listStructures(store: StructureStore): Structure[] {
  return [...store.structures.values()].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

/**
 * Makes a new structure and writes it to its file.
 *
 * @param store - The structures in memory.
 * @param draft - The new structure's name and sections.
 * @returns The structure made.
 */
export function createStructure(store: StructureStore, draft: StructureDraft): Structure {
  const now = new Date().toISOString();
  const structure: Structure = {
    id: claimId(store.root, STRUCTURE_IDS),
    ...draft,
    created: now,
    updated: now,
  };
  saveStructure(store, structure);
  return structure;
}

/**
 * Changes a structure's name or sections.
 *
 * @param store - The structures in memory.
 * @param structureId - The structure's id; an unknown id is an error.
 * @param draft - Its new name and sections.
 * @returns The structure changed.
 */
export function updateStructure(
  store: StructureStore,
  structureId: string,
  draft: StructureDraft,
): Structure {
  const structure = getStructure(store, structureId);
  const changed: Structure = { ...structure, ...draft, updated: new Date().toISOString() };
  saveStructure(store, changed);
  return changed;
}

/**
 * Deletes a structure's file.
 *
 * @param store - The structures in memory.
 * @param structureId - The structure's id; an unknown id is an error.
 */
export function deleteStructure(store: StructureStore, structureId: string): void {
  getStructure(store, structureId);
  rmSync(join(store.root, STRUCTURE_IDS.folder, structureId), { recursive: true, force: true });
  store.structures.delete(structureId);
}

/**
 * Returns a structure by its id.
 *
 * @param store - The structures in memory.
 * @param structureId - The structure's id.
 * @returns The structure; an unknown id is an error.
 */
function getStructure(store: StructureStore, structureId: string): Structure {
  const structure = store.structures.get(structureId);
  if (!structure) throw new Error(`no structure ${structureId}`);
  return structure;
}

/**
 * Writes a structure to its file and keeps it in memory.
 *
 * @param store - The structures in memory.
 * @param structure - The structure.
 */
function saveStructure(store: StructureStore, structure: Structure): void {
  writeJsonAtomically(
    join(store.root, STRUCTURE_IDS.folder, structure.id, STRUCTURE_FILE),
    structure,
  );
  store.structures.set(structure.id, structure);
}
