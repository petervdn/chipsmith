/**
 * The clips a song plays, as the editor lists them: in the order the song first plays them, each
 * with how many of the draft's blocks play it; a clip of the song no block plays any more comes last.
 * And where a clip's first block is, to select it. Knows nothing of the page.
 */
import type { Clip } from '../../shared/clip.types.ts';
import type { Track } from '../../shared/song.types.ts';
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
