/**
 * Making a take of a clip from a .fur file: a new clip, a variation of it with its label, cut to the
 * clip's channels when the clip was itself cut by channel (docs/adr/0037), its audio rendered. No
 * song is made or changed: the take is swapped into a block in the editor. Files only; the server
 * reads them when it is asked to look again.
 */
import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Tag } from '../shared/catalogue.types.ts';
import type { ClipRecord } from '../shared/clip.types.ts';
import type { FurFile } from '../fur/fur.types.ts';
import { getChannelFurFile } from '../fur/cut.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { renderClipAudio } from '../render/render-clip.ts';
import { writeJsonAtomically } from '../server/store.ts';
import { CLIP_IDS, claimId } from './ids.ts';

/** What a take is made from. */
export type NewTake = {
  /** The data folder, holding clips/. */
  root: string;
  /** The clip the take is made of. */
  parent: ClipRecord;
  /** The channels the take keeps, or null for all of them (getTakeChannels). */
  channels: number[] | null;
  /** The song the take was asked in. */
  songId: string;
  furFile: FurFile;
  /** What the take changed, in a few words. */
  label: string;
  /** The script that wrote the .fur file, copied into the clip. */
  scriptFile: string;
  tags: Tag[];
  key: string | null;
};

/**
 * Makes a take of a clip: its own source.fur (cut to the channels kept), script and audio, and a
 * clip.json whose parent is the clip, relation `variation`.
 *
 * @param newTake - What the take is made from.
 * @param newTake.root - The data folder, holding clips/.
 * @param newTake.parent - The clip the take is made of; its name and bars are the take's.
 * @param newTake.channels - The channels the take keeps, or null for all of them.
 * @param newTake.songId - The song the take was asked in.
 * @param newTake.furFile - The .fur file the script built for the take.
 * @param newTake.label - What the take changed, kept as its variation label.
 * @param newTake.scriptFile - The script that wrote the .fur file, copied into the clip.
 * @param newTake.tags - The take's tags.
 * @param newTake.key - The music's key, or null for the clip's.
 * @returns The id of the clip made.
 */
export async function makeTake({
  root,
  parent,
  channels,
  songId,
  furFile,
  label,
  scriptFile,
  tags,
  key,
}: NewTake): Promise<string> {
  const kept = getKeptFurFile(furFile, channels);
  const clipId = claimId(root, CLIP_IDS);
  const clipFolder = join(root, 'clips', clipId);
  writeFileSync(join(clipFolder, 'source.fur'), getFurFileBytes(kept));
  copyFileSync(scriptFile, join(clipFolder, 'script.ts'));
  const { furnace } = await renderClipAudio(clipFolder);
  const clip: ClipRecord = {
    id: clipId,
    created: new Date().toISOString(),
    name: parent.name,
    bars: parent.bars,
    parent: { clip: parent.id, relation: 'variation' },
    variationLabel: label.trim() || 'a take',
    madeFor: songId,
    tags,
    status: 'new',
    key: key ?? parent.key,
    furnace,
  };
  writeJsonAtomically(join(clipFolder, 'clip.json'), clip);
  return clipId;
}

/**
 * Returns the part of a take's .fur file that is kept: all of it, or one channel's.
 *
 * @param furFile - The .fur file the script built.
 * @param channels - The channels kept, or null for all of them.
 * @returns The .fur file kept; an error for more than one channel, which no cut makes.
 */
export function getKeptFurFile(furFile: FurFile, channels: number[] | null): FurFile {
  if (channels === null) return furFile;
  const [channel, ...others] = channels;
  if (channel === undefined || others.length > 0) {
    throw new Error(`a take keeps one channel of a cut clip, not ${channels.length}`);
  }
  return getChannelFurFile(furFile, channel);
}
