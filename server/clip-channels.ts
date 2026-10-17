/**
 * Fills in the channels of clips made before clips recorded them: a clip whose `channels` is null
 * gets the channels that play in its source.fur. Its audio and source are not touched.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPlayingChannels } from '../fur/cut.ts';
import { readFurFile } from '../fur/read.ts';
import type { Store } from './store.ts';
import { getClipFolder, saveClip } from './store.ts';

/**
 * Fills in `channels` for every clip without them that has a source.
 *
 * @param store - The clips and songs in memory.
 * @returns How many clips were filled in.
 */
export function fillClipChannels(store: Store): number {
  let count = 0;
  for (const clip of store.clips.values()) {
    const source = join(getClipFolder(store, clip.id), 'source.fur');
    if (clip.channels !== null || !existsSync(source)) continue;
    try {
      saveClip(store, { ...clip, channels: getPlayingChannels(readFurFile(readFileSync(source))) });
      count += 1;
    } catch (error) {
      console.warn(`${clip.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return count;
}
