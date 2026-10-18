/**
 * The edits of a song's arrangement: adding, moving, trimming, repeating, duplicating and removing a
 * block, putting another clip (a take) in it, and adding, renaming and removing a track. Each takes the tracks and gives new ones (the old are
 * left as they were), with where the edited block is now. Knows nothing of the page.
 */
import type { Block, BlockTrim, Track } from '../../shared/song.types.ts';

/** A block by where it is: its track and its place in the track's blocks. */
export type BlockPlace = { trackId: string; index: number };

/** Tracks after an edit, and where the edited block is in them (null when it is gone). */
export type Edited = { tracks: Track[]; place: BlockPlace | null };

/** The most times a block repeats. */
export const MOST_REPEATS = 64;

/**
 * Returns the block at a place.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @returns The block, or undefined when there is none there.
 */
export function getBlock(tracks: Track[], place: BlockPlace): Block | undefined {
  return tracks.find((track) => track.id === place.trackId)?.blocks[place.index];
}

/**
 * Adds a block of a whole clip, played once, to a track.
 *
 * @param tracks - The song's tracks.
 * @param to - Where it goes.
 * @param to.clipId - The clip it plays.
 * @param to.start - Where it starts, in ticks; below 0 is 0.
 * @param to.trackId - The track it goes to.
 * @returns The tracks with the block added, and where it is; as they were when there is no such
 *   track.
 */
export function addBlock(
  tracks: Track[],
  { clipId, start, trackId }: { clipId: string; start: number; trackId: string },
): Edited {
  if (!tracks.some((track) => track.id === trackId)) return { tracks, place: null };
  return putBlock(tracks, trackId, {
    clip: clipId,
    start: Math.max(0, start),
    trim: null,
    repeats: 1,
  });
}

/**
 * Moves a block to a start and a track; the block keeps its trim and repeats.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @param to - Where it goes.
 * @param to.start - Its new start, in ticks; below 0 is 0.
 * @param to.trackId - The track it goes to.
 * @returns The tracks with the block moved, and where it is now.
 */
export function moveBlock(
  tracks: Track[],
  place: BlockPlace,
  { start, trackId }: { start: number; trackId: string },
): Edited {
  const block = getBlock(tracks, place);
  if (!block || !tracks.some((track) => track.id === trackId)) return { tracks, place };
  const moved = { ...block, start: Math.max(0, start) };
  return putBlock(takeBlock(tracks, place), trackId, moved);
}

/**
 * Sets the part of its clip a block plays, and its start; a trim of the whole clip is no trim.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @param change - The new start and trim.
 * @param change.start - Where the block starts, in ticks.
 * @param change.trim - The part of the clip it plays, or null for all of it.
 * @param clipTicks - How long the block's clip is, in ticks.
 * @returns The tracks with the block trimmed, and where it is now.
 */
export function trimBlock(
  tracks: Track[],
  place: BlockPlace,
  { start, trim }: { start: number; trim: BlockTrim | null },
  clipTicks: number,
): Edited {
  const block = getBlock(tracks, place);
  if (!block) return { tracks, place };
  const isWhole = trim !== null && trim.offset === 0 && trim.length >= clipTicks;
  const trimmed = { ...block, start: Math.max(0, start), trim: isWhole ? null : trim };
  return putBlock(takeBlock(tracks, place), place.trackId, trimmed);
}

/**
 * Sets how many times a block plays, from 1 to MOST_REPEATS.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @param repeats - How many times it plays; kept within 1 and MOST_REPEATS.
 * @returns The tracks with the block's repeats set, and where it is.
 */
export function setRepeats(tracks: Track[], place: BlockPlace, repeats: number): Edited {
  const block = getBlock(tracks, place);
  if (!block) return { tracks, place };
  const kept = Math.min(MOST_REPEATS, Math.max(1, Math.round(repeats)));
  return { tracks: replaceBlock(tracks, place, { ...block, repeats: kept }), place };
}

/**
 * Places a copy of a block on its track right after it ends (after its repeats).
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @param clipTicks - How long the block's clip is, in ticks.
 * @returns The tracks with the copy added, and where the copy is.
 */
export function duplicateBlock(tracks: Track[], place: BlockPlace, clipTicks: number): Edited {
  const block = getBlock(tracks, place);
  if (!block) return { tracks, place };
  const length = block.trim ? block.trim.length : clipTicks;
  const copy = { ...block, start: block.start + length * block.repeats };
  return putBlock(tracks, place.trackId, copy);
}

/**
 * Puts another clip in a block, such as a take of its clip (docs/adr/0037): the block keeps its
 * start and repeats, and its trim as far as the new clip is long.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @param clipId - The clip it plays from now on.
 * @param clipTicks - How long that clip is, in ticks, or null when not known yet (a take just made,
 *   as long as the clip it was made of): the trim is kept as it is.
 * @returns The tracks with the block's clip changed, and where it is.
 */
export function setBlockClip(
  tracks: Track[],
  place: BlockPlace,
  clipId: string,
  clipTicks: number | null,
): Edited {
  const block = getBlock(tracks, place);
  if (!block) return { tracks, place };
  if (clipTicks === null) {
    return { tracks: replaceBlock(tracks, place, { ...block, clip: clipId }), place };
  }
  const { trim } = block;
  const keptTrim =
    trim && trim.offset < clipTicks
      ? { offset: trim.offset, length: Math.min(trim.length, clipTicks - trim.offset) }
      : null;
  const isWhole = keptTrim !== null && keptTrim.offset === 0 && keptTrim.length >= clipTicks;
  const changed = { ...block, clip: clipId, trim: isWhole ? null : keptTrim };
  return { tracks: replaceBlock(tracks, place, changed), place };
}

/**
 * Returns where the blocks that play a clip are.
 *
 * @param tracks - The song's tracks.
 * @param clipId - The clip.
 * @returns Their places, track by track.
 */
export function getClipPlaces(tracks: Track[], clipId: string): BlockPlace[] {
  return tracks.flatMap((track) =>
    track.blocks.flatMap((block, index) =>
      block.clip === clipId ? [{ trackId: track.id, index }] : [],
    ),
  );
}

/**
 * Removes a block; its clip stays in the pool.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @returns The tracks without the block, and no place.
 */
export function removeBlock(tracks: Track[], place: BlockPlace): Edited {
  return { tracks: takeBlock(tracks, place), place: null };
}

/**
 * Adds an empty track at the bottom, named "Track N".
 *
 * @param tracks - The song's tracks.
 * @returns The tracks with the new one last.
 */
export function addTrack(tracks: Track[]): Track[] {
  const numbers = tracks.map((track) => Number(/^t(\d+)$/.exec(track.id)?.[1] ?? 0));
  const next = Math.max(0, ...numbers) + 1;
  return [...tracks, { id: `t${next}`, name: `Track ${tracks.length + 1}`, volume: 0, blocks: [] }];
}

/**
 * Renames a track; an empty name, or the name it has, leaves the tracks as they were.
 *
 * @param tracks - The song's tracks.
 * @param trackId - The track to rename.
 * @param name - Its new name.
 * @returns The tracks with the track renamed.
 */
export function renameTrack(tracks: Track[], trackId: string, name: string): Track[] {
  const trimmed = name.trim();
  const track = tracks.find((candidate) => candidate.id === trackId);
  if (!trimmed || !track || track.name === trimmed) return tracks;
  return tracks.map((track) => (track.id === trackId ? { ...track, name: trimmed } : track));
}

/**
 * Sets a track's level; the level it has already leaves the tracks as they were.
 *
 * @param tracks - The song's tracks.
 * @param trackId - The track.
 * @param volume - Its level, in decibels.
 * @returns The tracks with the track's level set.
 */
export function setTrackVolume(tracks: Track[], trackId: string, volume: number): Track[] {
  const track = tracks.find((candidate) => candidate.id === trackId);
  if (!track || track.volume === volume) return tracks;
  return tracks.map((track) => (track.id === trackId ? { ...track, volume } : track));
}

/**
 * Removes a track and its blocks.
 *
 * @param tracks - The song's tracks.
 * @param trackId - The track to remove.
 * @returns The tracks without it.
 */
export function removeTrack(tracks: Track[], trackId: string): Track[] {
  return tracks.filter((track) => track.id !== trackId);
}

/**
 * Returns the tracks with a block taken out of its track.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @returns The tracks without the block.
 */
function takeBlock(tracks: Track[], place: BlockPlace): Track[] {
  return tracks.map((track) =>
    track.id === place.trackId
      ? { ...track, blocks: track.blocks.filter((_unused, i) => i !== place.index) }
      : track,
  );
}

/**
 * Returns the tracks with a block put in a track, its blocks kept in order of their start.
 *
 * @param tracks - The song's tracks.
 * @param trackId - The track it goes in.
 * @param block - The block.
 * @returns The tracks with the block in, and where it is.
 */
function putBlock(tracks: Track[], trackId: string, block: Block): Edited {
  let index = 0;
  const next = tracks.map((track) => {
    if (track.id !== trackId) return track;
    const blocks = [...track.blocks, block].sort((first, second) => first.start - second.start);
    index = blocks.indexOf(block);
    return { ...track, blocks };
  });
  return { tracks: next, place: { trackId, index } };
}

/**
 * Returns the tracks with the block at a place replaced, at the same place.
 *
 * @param tracks - The song's tracks.
 * @param place - Where the block is.
 * @param block - The block that takes its place.
 * @returns The tracks with the block replaced.
 */
function replaceBlock(tracks: Track[], place: BlockPlace, block: Block): Track[] {
  return tracks.map((track) =>
    track.id === place.trackId
      ? { ...track, blocks: track.blocks.map((old, i) => (i === place.index ? block : old)) }
      : track,
  );
}
