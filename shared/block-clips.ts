/**
 * The clip a song's blocks play, changed for all of them at once: when a take is deleted or updated
 * (docs/adr/0039), every block that played it plays the clip that replaces it. Given tracks, gives
 * tracks; knows nothing of files or the page.
 */
import type { Track } from './song.schema.ts';

/**
 * Returns the tracks with every block that plays a clip playing another one instead; each block
 * keeps its start, trim and repeats.
 *
 * @param tracks - The song's tracks.
 * @param fromClipId - The clip the blocks play now.
 * @param toClipId - The clip they play instead.
 * @returns The same tracks when no block plays the clip, else new tracks with those blocks changed.
 */
export function replaceBlockClip(tracks: Track[], fromClipId: string, toClipId: string): Track[] {
  const isPlayed = tracks.some((track) => track.blocks.some((block) => block.clip === fromClipId));
  if (!isPlayed) return tracks;
  return tracks.map((track) => ({
    ...track,
    blocks: track.blocks.map((block) =>
      block.clip === fromClipId ? { ...block, clip: toClipId } : block,
    ),
  }));
}
