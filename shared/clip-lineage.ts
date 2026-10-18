/**
 * A clip's lineage: the clips it was made from, parent by parent, back to a whole clip. Given a way
 * to find a clip, gives answers; knows nothing of files or the page.
 */
import type { Clip, ClipRecord } from './clip.types.ts';

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
  getClip: (clipId: string) => Clip | undefined,
): boolean {
  const seen = new Set<string>();
  let current: ClipRecord | undefined = clip;
  while (current?.parent && !seen.has(current.id)) {
    if (current.parent.relation === 'variation') return true;
    seen.add(current.id);
    current = getClip(current.parent.clip);
  }
  return false;
}
