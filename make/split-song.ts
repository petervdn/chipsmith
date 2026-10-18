/**
 * Splitting a song that is one whole clip into its channels: a new clip per channel that plays (its
 * own source.fur with only that channel's notes, the whole clip's script, a clip.json whose parent
 * is the whole clip, relation `split`), each placed alone on a track named after its channel (what
 * the song calls it and the chip's channel, "Drums · SID 3", or the chip's channel alone), as long as
 * the song. The pieces' audio is not rendered here: they are clips with a source and no audio,
 * which the server renders.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getChannelName } from '../shared/clip-channels.ts';
import type { Clip, ClipRecord } from '../shared/clip.schema.ts';
import type { Song, Track } from '../shared/song.schema.ts';
import { getChannelFurFile, getPlayingChannels } from '../fur/cut.ts';
import { readFurFile } from '../fur/read.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { getClipRecord, writeJsonAtomically } from '../server/store.ts';
import { CLIP_IDS, claimId } from './ids.ts';

/**
 * Splits a song's whole clip into a clip per channel and gives the tracks that place them.
 *
 * @param root - The data folder, holding clips/ and songs/.
 * @param song - The song, whose one block plays `whole`.
 * @param whole - The whole clip, with its source.fur in its folder.
 * @returns The new tracks (one per channel that plays) and the new clips' records.
 */
export function splitSong(
  root: string,
  song: Song,
  whole: Clip,
): { tracks: Track[]; clips: ClipRecord[] } {
  const wholeFolder = join(root, 'clips', whole.id);
  const furFile = readFurFile(readFileSync(join(wholeFolder, 'source.fur')));
  const created = new Date().toISOString();
  const chipChannels: string[] = [];
  const clips = getPlayingChannels(furFile).map((channel): ClipRecord => {
    const chipChannel = getChannelName(whole.chips, channel);
    chipChannels.push(chipChannel);
    const id = claimId(root, CLIP_IDS);
    const folder = join(root, 'clips', id);
    writeFileSync(join(folder, 'source.fur'), getFurFileBytes(getChannelFurFile(furFile, channel)));
    if (existsSync(join(wholeFolder, 'script.ts'))) {
      copyFileSync(join(wholeFolder, 'script.ts'), join(folder, 'script.ts'));
    }
    const clip: ClipRecord = {
      ...getClipRecord(whole),
      id,
      created,
      name: { section: null, stem: getStemName(furFile.song.channelNames[channel], chipChannel) },
      parent: { clip: whole.id, relation: 'split' },
      variationLabel: null,
      madeFor: song.id,
      tags: [],
      status: 'new',
      furnace: null,
    };
    writeJsonAtomically(join(folder, 'clip.json'), clip);
    return clip;
  });
  const tracks = clips.map((clip, i): Track => ({
    id: `t${i + 1}`,
    name: getTrackName(clip.name.stem, chipChannels[i] ?? `Channel ${i + 1}`),
    volume: 0,
    blocks: [{ clip: clip.id, start: 0, trim: null, repeats: 1 }],
  }));
  return { tracks, clips };
}

/**
 * Returns the stem a channel's clip is called: what the song calls the channel, else the chip's
 * channel.
 *
 * @param songName - The song's name for the channel, or an empty string or undefined for none.
 * @param chipChannel - The chip's name for the channel ("SID 3").
 * @returns The stem.
 */
function getStemName(songName: string | undefined, chipChannel: string): string {
  return songName?.trim() || chipChannel;
}

/**
 * Returns a channel's track name: the clip's stem with the chip's channel after it, or the chip's
 * channel alone when the stem is it.
 *
 * @param stem - The stem of the channel's clip.
 * @param chipChannel - The chip's name for the channel.
 * @returns "Drums · SID 3", or "SID 3".
 */
function getTrackName(stem: string | null, chipChannel: string): string {
  return stem && stem !== chipChannel ? `${stem} · ${chipChannel}` : chipChannel;
}
