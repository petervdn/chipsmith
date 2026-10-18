/**
 * The clips a song plays, as the editor lists them: in the order the song first plays them, each
 * with how many of the draft's blocks play it; a clip of the song no block plays any more comes last.
 * Where a clip's first block is, to select it; and the clips the draft plays, a take swapped in from
 * the pool among them. Knows nothing of the page.
 */
import type { Clip } from '../../shared/clip.schema.ts';
import type { Track } from '../../shared/song.schema.ts';
import type { BlockPlace } from './song-edits.ts';

/** A clip of the song, and how many blocks play it. */
export type SongClip = { clip: Clip; blockCount: number };

/**
 * Returns the song's clips in the order it first plays them, with how many blocks play each.
 *
 * @param tracks - The song's tracks, as edited.
 * @param clips - The clips of the song.
 * @returns The clips, the earliest first; those no block plays last, in the order given.
 */
export function getSongClips(tracks: Track[], clips: Clip[]): SongClip[] {
  const blocks = tracks.flatMap((track) => track.blocks);
  function getFirstStart(clipId: string): number {
    const starts = blocks.filter((block) => block.clip === clipId).map((block) => block.start);
    return starts.length > 0 ? Math.min(...starts) : Infinity;
  }
  return clips
    .map((clip, order) => ({
      clip,
      blockCount: blocks.filter((block) => block.clip === clip.id).length,
      firstStart: getFirstStart(clip.id),
      order,
    }))
    .sort((first, second) => first.firstStart - second.firstStart || first.order - second.order)
    .map(({ clip, blockCount }) => ({ clip, blockCount }));
}

/**
 * Returns where the earliest block that plays a clip is.
 *
 * @param tracks - The song's tracks.
 * @param clipId - The clip.
 * @returns The place of its earliest block (the upper track's when two start together), or null
 *   when no block plays it.
 */
export function getFirstBlockPlace(tracks: Track[], clipId: string): BlockPlace | null {
  const places = tracks.flatMap((track) =>
    track.blocks.flatMap((block, index) =>
      block.clip === clipId ? [{ place: { trackId: track.id, index }, start: block.start }] : [],
    ),
  );
  const first = places.reduce<(typeof places)[number] | null>(
    (earliest, candidate) => (earliest && earliest.start <= candidate.start ? earliest : candidate),
    null,
  );
  return first?.place ?? null;
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
