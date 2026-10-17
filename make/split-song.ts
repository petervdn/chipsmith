/**
 * Splitting a song that is one whole clip into its channels: a new clip per channel that plays (its
 * own source.fur with only that channel's notes, the whole clip's script, a clip.json whose parent
 * is the whole clip, relation `split`), each placed alone on a track named after its channel, as long
 * as the song. The pieces' audio is not rendered here: they are clips with a source and no audio,
 * which the server renders.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getChannelName } from '../shared/clip-channels.ts';
import type { Clip } from '../shared/clip.types.ts';
import type { Song, Track } from '../shared/song.types.ts';
import { getChannelFurFile, getPlayingChannels } from '../fur/cut.ts';
import { readFurFile } from '../fur/read.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { writeJsonAtomically } from '../server/store.ts';
import { CLIP_IDS, claimId } from './ids.ts';

/**
 * Splits a song's whole clip into a clip per channel and gives the tracks that place them.
 *
 * @param root - The data folder, holding clips/ and songs/.
 * @param song - The song, whose one block plays `whole`.
 * @param whole - The whole clip, with its source.fur in its folder.
 * @returns The new tracks (one per channel that plays) and the new clips.
 */
export function splitSong(
  root: string,
  song: Song,
  whole: Clip,
): { tracks: Track[]; clips: Clip[] } {
  const wholeFolder = join(root, 'clips', whole.id);
  const furFile = readFurFile(readFileSync(join(wholeFolder, 'source.fur')));
  const created = new Date().toISOString();
  const clips = getPlayingChannels(furFile).map((channel): Clip => {
    const id = claimId(root, CLIP_IDS);
    const folder = join(root, 'clips', id);
    writeFileSync(join(folder, 'source.fur'), getFurFileBytes(getChannelFurFile(furFile, channel)));
    if (existsSync(join(wholeFolder, 'script.ts'))) {
      copyFileSync(join(wholeFolder, 'script.ts'), join(folder, 'script.ts'));
    }
    const clip: Clip = {
      ...whole,
      id,
      created,
      name: { section: null, stem: getChannelName(whole.chips, channel) },
      channels: [channel],
      parent: { clip: whole.id, relation: 'split' },
      madeFor: song.id,
      tags: [],
      status: 'new',
    };
    writeJsonAtomically(join(folder, 'clip.json'), clip);
    return clip;
  });
  const tracks = clips.map((clip, i): Track => ({
    id: `t${i + 1}`,
    name: clip.name.stem ?? `Channel ${i + 1}`,
    blocks: [{ clip: clip.id, start: 0, trim: null, repeats: 1 }],
  }));
  return { tracks, clips };
}
