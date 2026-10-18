/**
 * Making a new song from a .fur file: a whole clip (its own source.fur, script and audio, and clip.json)
 * and a song of one track that plays it (docs/adr/0010). Files only; the server reads them when it is
 * asked to look again (`POST /api/rescan`).
 */
import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Status, Tag } from '../shared/catalogue.types.ts';
import type { ClipRecord } from '../shared/clip.types.ts';
import type { SentGuide } from '../shared/guide.types.ts';
import type { Song } from '../shared/song.types.ts';
import type { FurFile } from '../fur/fur.types.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { renderClipAudio } from '../render/render-clip.ts';
import { writeJsonAtomically } from '../server/store.ts';
import { CLIP_IDS, SONG_IDS, claimId } from './ids.ts';
import { getBeatsPerBar, getBpm } from './fur-file-facts.ts';
import type { SentHarmony } from '../shared/harmony.types.ts';
import type { SentStructure } from '../shared/structure.types.ts';

/** What a new song is made from. */
export type NewSong = {
  /** The data folder, holding clips/ and songs/. */
  root: string;
  title: string;
  furFile: FurFile;
  /** The prompt as written, or what the song was made from. */
  prompt: string;
  /** The style guides sent with the prompt, copied. */
  guides: SentGuide[];
  /** The structure sent with the prompt, copied, or null. */
  structure?: SentStructure | null;
  /** The harmony sent with the prompt, copied, or null. */
  harmony?: SentHarmony | null;
  /** The script that wrote the .fur file, copied into the clip. */
  scriptFile: string;
  tags: Tag[];
  status: Status;
  key: string | null;
  /** The song whose prompt was sent again, or null. */
  promptedFrom: string | null;
};

/** The ids of what was made. */
export type MadeSong = { songId: string; clipId: string };

/**
 * Makes a new song from a .fur file: a whole clip, with its audio rendered, and a song of one track
 * that plays it.
 *
 * @param newSong - What the song is made from.
 * @param newSong.root - The data folder, holding clips/ and songs/.
 * @param newSong.title - The song's title.
 * @param newSong.furFile - The .fur file, written as the clip's source.fur.
 * @param newSong.prompt - The prompt as written, or what the song was made from.
 * @param newSong.guides - The style guides sent with the prompt, copied into the song.
 * @param newSong.structure - The structure sent with the prompt, copied into the song, or null.
 * @param newSong.harmony - The harmony sent with the prompt, copied into the song, or null.
 * @param newSong.scriptFile - The script that wrote the .fur file, copied into the clip.
 * @param newSong.tags - The tags of the clip and the song.
 * @param newSong.status - The status of the clip and the song.
 * @param newSong.key - The music's key, or null.
 * @param newSong.promptedFrom - The song whose prompt was sent again, or null.
 * @returns The ids of the song and the clip made.
 */
export async function makeSong({
  root,
  title,
  furFile,
  prompt,
  guides,
  structure = null,
  harmony = null,
  scriptFile,
  tags,
  status,
  key,
  promptedFrom,
}: NewSong): Promise<MadeSong> {
  const clipId = claimId(root, CLIP_IDS);
  const songId = claimId(root, SONG_IDS);
  const clipFolder = join(root, 'clips', clipId);
  writeFileSync(join(clipFolder, 'source.fur'), getFurFileBytes(furFile));
  copyFileSync(scriptFile, join(clipFolder, 'script.ts'));
  const { furnace } = await renderClipAudio(clipFolder);
  const created = new Date().toISOString();
  const bpm = getBpm(furFile.song);
  const beats = getBeatsPerBar(furFile.song);
  const clip: ClipRecord = {
    id: clipId,
    created,
    name: { section: null, stem: null },
    bars: null,
    parent: null,
    variationLabel: null,
    madeFor: songId,
    tags,
    status,
    key,
    furnace,
  };
  const song: Song = {
    id: songId,
    title,
    created,
    updated: created,
    bpm,
    beats,
    tags,
    status,
    prompt,
    guides,
    structure,
    harmony,
    promptedFrom,
    tracks: [
      {
        id: 't1',
        name: 'Whole',
        volume: 0,
        blocks: [{ clip: clipId, start: 0, trim: null, repeats: 1 }],
      },
    ],
  };
  writeJsonAtomically(join(clipFolder, 'clip.json'), clip);
  writeJsonAtomically(join(root, 'songs', songId, 'song.json'), song);
  return { songId, clipId };
}
