/**
 * Deleting a take (docs/adr/0039): whether one can go, and the take replaced by another clip and
 * deleted. Every saved song's blocks that played it play the clip that replaces it, and the clips
 * made from it are made from that clip, so the line of takes stays one line. Knows nothing of HTTP.
 */
import { rmSync } from 'node:fs';
import { replaceBlockClip } from '../shared/block-clips.ts';
import type { Store } from './store.ts';
import { getChildClips, getClipFolder, getSongsUsingClip, saveClip, saveSong } from './store.ts';

/**
 * Returns why a take cannot be deleted from the song it is edited in, or null when it can: it must
 * be a variation (the original of a line stays), and no other song may play it.
 *
 * @param store - The clips and songs in memory.
 * @param clipId - The take's id.
 * @param songId - The song it is deleted from.
 * @returns The reason, in a sentence, or null.
 */
export function getTakeDeletionProblem(
  store: Store,
  clipId: string,
  songId: string,
): string | null {
  const clip = store.clips.get(clipId);
  if (!clip) return `no clip ${clipId}`;
  if (clip.parent?.relation !== 'variation') return 'only a take can be deleted, not the original';
  if (!store.clips.has(clip.parent.clip)) return `the clip ${clipId} was made from is missing`;
  const others = getSongsUsingClip(store, clipId)
    .filter((otherId) => otherId !== songId)
    .map((otherId) => store.songs.get(otherId)?.title ?? otherId);
  if (others.length > 0) return `it is played in ${others.join(', ')} too`;
  return null;
}

/**
 * Replaces a take by another clip and deletes it: the blocks of the saved songs that played it play
 * the other clip, the clips made from it are made from the other clip, and its folder goes.
 *
 * @param store - The clips and songs in memory.
 * @param takeId - The take deleted.
 * @param replacementId - The clip that takes its place: the clip it was made from, or a take that
 *   updates it.
 */
export function replaceTake(store: Store, takeId: string, replacementId: string): void {
  for (const songId of getSongsUsingClip(store, takeId)) {
    const song = store.songs.get(songId);
    if (!song) continue;
    const tracks = replaceBlockClip(song.tracks, takeId, replacementId);
    saveSong(store, { ...song, tracks, updated: new Date().toISOString() });
  }
  for (const child of getChildClips(store, takeId)) {
    if (!child.parent || child.id === replacementId) continue;
    saveClip(store, { ...child, parent: { ...child.parent, clip: replacementId } });
  }
  rmSync(getClipFolder(store, takeId), { recursive: true, force: true });
  store.clips.delete(takeId);
}
