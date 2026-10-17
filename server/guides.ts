/**
 * The style guides in memory, each also in `guides/<id>/guide.json` (docs/adr/0019): made, changed and
 * deleted from the Guides page, and copied into a job when chosen with a prompt. Knows nothing of HTTP.
 */
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Guide, GuideDraft, SentGuide } from '../shared/guide.types.ts';
import { GUIDE_IDS, claimId } from '../make/ids.ts';
import { checkGuide } from './model-checks.ts';
import { writeJsonAtomically } from './store.ts';

/** The guides, by id, and the data folder they are kept in. */
export type GuideStore = { root: string; guides: Map<string, Guide> };

const GUIDE_FILE = 'guide.json';

/** Reads every guide under `root`/guides; one that does not read is reported and left. */
export function openGuides(root: string): GuideStore {
  const store: GuideStore = { root, guides: new Map() };
  const folder = join(root, GUIDE_IDS.folder);
  if (!existsSync(folder)) return store;
  for (const id of readdirSync(folder)) {
    const file = join(folder, id, GUIDE_FILE);
    if (!existsSync(file)) continue;
    try {
      const guide = checkGuide(JSON.parse(readFileSync(file, 'utf8')), file);
      store.guides.set(guide.id, guide);
    } catch (error) {
      console.warn(`unreadable ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return store;
}

/** The guides, by name. */
export function listGuides(store: GuideStore): Guide[] {
  return [...store.guides.values()].sort((first, second) => first.name.localeCompare(second.name));
}

/** Makes a new guide. */
export function createGuide(store: GuideStore, draft: GuideDraft): Guide {
  const now = new Date().toISOString();
  const guide: Guide = { id: claimId(store.root, GUIDE_IDS), ...draft, created: now, updated: now };
  saveGuide(store, guide);
  return guide;
}

/** Changes a guide's name, text or default; what was already sent with it keeps its copy. */
export function updateGuide(store: GuideStore, guideId: string, draft: GuideDraft): Guide {
  const guide = getGuide(store, guideId);
  const changed: Guide = { ...guide, ...draft, updated: new Date().toISOString() };
  saveGuide(store, changed);
  return changed;
}

/** Deletes a guide's file; what was already sent with it keeps its copy. */
export function deleteGuide(store: GuideStore, guideId: string): void {
  getGuide(store, guideId);
  rmSync(join(store.root, GUIDE_IDS.folder, guideId), { recursive: true, force: true });
  store.guides.delete(guideId);
}

/** Copies of the guides chosen with a prompt, in the order chosen; an unknown id is an error. */
export function getSentGuides(store: GuideStore, guideIds: string[]): SentGuide[] {
  return guideIds.map((guideId) => {
    const { id, name, text } = getGuide(store, guideId);
    return { id, name, text };
  });
}

function getGuide(store: GuideStore, guideId: string): Guide {
  const guide = store.guides.get(guideId);
  if (!guide) throw new Error(`no guide ${guideId}`);
  return guide;
}

function saveGuide(store: GuideStore, guide: Guide): void {
  writeJsonAtomically(join(store.root, GUIDE_IDS.folder, guide.id, GUIDE_FILE), guide);
  store.guides.set(guide.id, guide);
}
