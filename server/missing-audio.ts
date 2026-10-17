/**
 * Audio that is not there yet: a clip with a source.fur and no audio.flac (a fresh checkout, the
 * examples, a data folder restored without its audio) is rendered when the server starts, one clip at
 * a time, in the background (docs/adr/0011). Knows nothing of HTTP.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderClipAudio } from '../render/render-clip.ts';
import type { Store } from './store.ts';
import { getClipFolder } from './store.ts';

/**
 * Checks whether a clip has no audio yet but can have it, because its source is there.
 *
 * @param store - The clips and songs in memory.
 * @param clipId - The clip's id.
 * @returns Whether its audio.flac is missing and its source.fur is there.
 */
export function isAudioMissing(store: Store, clipId: string): boolean {
  const folder = getClipFolder(store, clipId);
  return !existsSync(join(folder, 'audio.flac')) && existsSync(join(folder, 'source.fur'));
}

/**
 * Returns the ids of the clips whose audio is missing.
 *
 * @param store - The clips and songs in memory.
 * @returns The ids, sorted.
 */
export function getClipsMissingAudio(store: Store): string[] {
  return [...store.clips.keys()].filter((clipId) => isAudioMissing(store, clipId)).sort();
}

/**
 * Renders every clip whose audio is missing, one after another, and says in the server's log what it
 * did. A clip that fails is reported and left; it is tried again when the server next starts.
 *
 * @param store - The clips and songs in memory.
 */
export async function renderMissingAudio(store: Store): Promise<void> {
  const clipIds = getClipsMissingAudio(store);
  if (clipIds.length === 0) return;
  console.log(`rendering the missing audio of ${clipIds.length} clips`);
  for (const clipId of clipIds) {
    if (!isAudioMissing(store, clipId)) continue;
    try {
      const { furnace } = await renderClipAudio(getClipFolder(store, clipId));
      const recorded = store.clips.get(clipId)?.furnace;
      if (recorded && recorded !== furnace) {
        console.warn(`${clipId} rendered with Furnace ${furnace}; it was made with ${recorded}`);
      }
    } catch (error) {
      console.warn(`${clipId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log('missing audio rendered');
}
