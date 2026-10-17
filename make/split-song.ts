/**
 * Splitting a song that is one whole clip into tracks of blocks: its .fur file cut along its
 * channels and order rows (fur/cut.ts), a new clip per piece (its own source.fur, the whole clip's
 * script, a clip.json whose parent is the whole clip, relation `split`), and the tracks that place
 * them, a piece played again in a row being one block repeated. The pieces' audio is not rendered
 * here: they are clips with a source and no audio, which the server renders.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Clip } from '../shared/clip.types.ts';
import { getTicksPerSecond } from '../shared/song-length.ts';
import type { Block, Song, Track } from '../shared/song.types.ts';
import { getCut, getPieceFurFile, getSecondsPerRow } from '../fur/cut.ts';
import { readFurFile } from '../fur/read.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { writeJsonAtomically } from '../server/store.ts';
import { getChipNames } from './fur-file-facts.ts';
import { CLIP_IDS, claimId } from './ids.ts';

/** The channels of a chip this project writes. */
const CHANNELS_OF_CHIP = 5;

/**
 * Splits a song's whole clip into a clip per piece and gives the tracks that place them.
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
  const cut = getCut(furFile);
  const orderSeconds = furFile.song.patternLength * getSecondsPerRow(furFile.song);
  const orderBars = orderSeconds / ((whole.beats * 60) / whole.bpm);
  const chipNames = getChipNames(furFile.song);
  const names = new Map(cut.channels.map(({ channel, name }) => [channel, name]));
  const created = new Date().toISOString();
  const clips = cut.pieces.map((piece): Clip => {
    const id = claimId(root, CLIP_IDS);
    const folder = join(root, 'clips', id);
    writeFileSync(join(folder, 'source.fur'), getFurFileBytes(getPieceFurFile(furFile, piece)));
    if (existsSync(join(wholeFolder, 'script.ts'))) {
      copyFileSync(join(wholeFolder, 'script.ts'), join(folder, 'script.ts'));
    }
    const clip: Clip = {
      ...whole,
      id,
      created,
      name: { section: piece.section, stem: names.get(piece.channel) ?? null },
      bars: {
        from: round(piece.firstOrder * orderBars),
        to: round((piece.firstOrder + 1) * orderBars),
      },
      channels: [piece.channel],
      parent: { clip: whole.id, relation: 'split' },
      madeFor: song.id,
      tags: [],
      status: 'new',
      chips: [chipNames[Math.floor(piece.channel / CHANNELS_OF_CHIP)] ?? 'unknown'],
      seconds: orderSeconds,
    };
    writeJsonAtomically(join(folder, 'clip.json'), clip);
    return clip;
  });
  const ticksPerOrder = orderSeconds * getTicksPerSecond(song.bpm);
  const tracks = cut.channels.map(({ name, orders }, i): Track => ({
    id: `t${i + 1}`,
    name,
    blocks: getBlocks(orders, ticksPerOrder, (piece) => clips[piece]?.id ?? ''),
  }));
  return { tracks, clips };
}

/**
 * Returns a track's blocks from the piece each order row plays: a block per stretch of order rows
 * playing the same piece, repeated as often as it plays in a row.
 *
 * @param orders - The piece each order row plays, or null for none.
 * @param ticksPerOrder - How long an order row is, in ticks.
 * @param getClipId - Gives the id of a piece's clip.
 * @returns The blocks, in order of their start.
 */
function getBlocks(
  orders: (number | null)[],
  ticksPerOrder: number,
  getClipId: (piece: number) => string,
): Block[] {
  const blocks: Block[] = [];
  let previous: number | null = null;
  for (const [order, piece] of orders.entries()) {
    const last = blocks.at(-1);
    if (piece !== null && piece === previous && last) {
      last.repeats += 1;
    } else if (piece !== null) {
      blocks.push({
        clip: getClipId(piece),
        start: Math.round(order * ticksPerOrder),
        trim: null,
        repeats: 1,
      });
    }
    previous = piece;
  }
  return blocks;
}

/**
 * Rounds a number of bars to hundredths.
 *
 * @param bars - The bars.
 * @returns The bars, rounded.
 */
function round(bars: number): number {
  return Math.round(bars * 100) / 100;
}
