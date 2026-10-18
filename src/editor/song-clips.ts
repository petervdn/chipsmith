/**
 * The clips a song plays, as the editor lists them: in the order the song first plays them, each
 * with how many of the draft's blocks play it and its takes under it; a clip of the song no block
 * plays any more comes last. And the clips the draft plays, a take swapped in from the pool among
 * them. Knows nothing of the page.
 */
import type { Clip } from '../../shared/clip.schema.ts';
import type { Track } from '../../shared/song.schema.ts';
import { getVersionTree } from './versions.ts';

/** A clip, and how many blocks play it. */
export type CountedClip = { clip: Clip; blockCount: number };

/** A take, how many blocks play it, and how many takes deep it is (a take of the clip is 1). */
export type CountedTake = CountedClip & { depth: number };

/**
 * A clip of the song, how many blocks play it, and its takes (docs/adr/0037) as a family tree: each
 * under the take it was made from, the takes of one clip oldest first.
 */
export type SongClip = CountedClip & { takes: CountedTake[] };

/**
 * Returns the song's clips in the order it first plays them, with how many blocks play each, and
 * under each the takes made of it. A take the song plays is listed under the clip it was made from,
 * not on its own; so is a take in the pool no block plays yet.
 *
 * @param tracks - The song's tracks, as edited.
 * @param clips - The clips of the song.
 * @param pool - The clip pool, to find takes in; empty while it loads.
 * @returns The clips, the earliest first (a clip counts from the first block of it or its takes);
 * those no block plays last, in the order given.
 */
export function getSongClips(tracks: Track[], clips: Clip[], pool: Clip[]): SongClip[] {
  const blocks = tracks.flatMap((track) => track.blocks);
  const known = [...clips, ...pool.filter((clip) => !clips.some(({ id }) => id === clip.id))];
  function count(clip: Clip): CountedClip {
    return { clip, blockCount: blocks.filter((block) => block.clip === clip.id).length };
  }
  function getFirstStart(clipIds: string[]): number {
    const starts = blocks
      .filter((block) => clipIds.includes(block.clip))
      .map((block) => block.start);
    return starts.length > 0 ? Math.min(...starts) : Infinity;
  }
  const listed = new Set<string>();
  const groups: { songClip: SongClip; firstStart: number; order: number }[] = [];
  for (const [order, clip] of clips.entries()) {
    if (listed.has(clip.id)) continue;
    const [headRow, ...takeRows] = getVersionTree(clip.id, known);
    const head = headRow?.clip ?? clip;
    const takes = takeRows.map((row) => ({ ...count(row.clip), depth: row.depth }));
    for (const version of [head, ...takes.map((take) => take.clip)]) listed.add(version.id);
    groups.push({
      songClip: { ...count(head), takes },
      firstStart: getFirstStart([head, ...takes.map((take) => take.clip)].map(({ id }) => id)),
      order,
    });
  }
  return groups
    .sort((first, second) => first.firstStart - second.firstStart || first.order - second.order)
    .map(({ songClip }) => songClip);
}

/**
 * Returns the clips the editor knows: the saved song's, and any clip of the pool the draft plays
 * that the saved song does not (a take swapped in, docs/adr/0037).
 *
 * @param tracks - The song's tracks, as edited.
 * @param songClips - The clips the saved song plays.
 * @param pool - The clip pool, or none before it is read.
 * @returns The song's clips, then the pool's the draft plays besides.
 */
export function getEditorClips(tracks: Track[], songClips: Clip[], pool: Clip[]): Clip[] {
  const played = new Set(tracks.flatMap((track) => track.blocks.map((block) => block.clip)));
  const known = new Set(songClips.map((clip) => clip.id));
  return [...songClips, ...pool.filter((clip) => played.has(clip.id) && !known.has(clip.id))];
}
