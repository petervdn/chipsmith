/**
 * A clip's lineage: the clips it was made from, parent by parent, back to a whole clip; whether a
 * variation is among them, and the channels a take of it keeps. Given a way to find a clip, gives
 * answers; knows nothing of files or the page.
 */
import type { Clip, ClipRecord, ClipRelation } from './clip.types.ts';

/**
 * Returns whether a clip, or any clip it was made from, is a variation: its music was changed after
 * the prompt of the song it goes back to (docs/adr/0036).
 *
 * @param clip - The clip.
 * @param getClip - Finds a clip by its id, or gives undefined when there is none.
 * @returns Whether a variation is in its lineage; a parent that cannot be found ends it.
 */
export function hasVariationInLineage(
  clip: ClipRecord,
  getClip: (clipId: string) => ClipRecord | undefined,
): boolean {
  return hasRelationInLineage(clip, 'variation', getClip);
}

/**
 * Returns the channels a take of a clip keeps: the clip's own when it was cut by channel (a take
 * changes only its channel, docs/adr/0037), or all of them for a whole clip.
 *
 * @param clip - The clip the take is made of.
 * @param getClip - Finds a clip by its id, or gives undefined when there is none.
 * @returns The channels kept, or null for all of them.
 */
export function getTakeChannels(
  clip: Clip,
  getClip: (clipId: string) => ClipRecord | undefined,
): number[] | null {
  return hasRelationInLineage(clip, 'split', getClip) ? clip.channels : null;
}

function hasRelationInLineage(
  clip: ClipRecord,
  relation: ClipRelation,
  getClip: (clipId: string) => ClipRecord | undefined,
): boolean {
  const seen = new Set<string>();
  let current: ClipRecord | undefined = clip;
  while (current?.parent && !seen.has(current.id)) {
    if (current.parent.relation === relation) return true;
    seen.add(current.id);
    current = getClip(current.parent.clip);
  }
  return false;
}
