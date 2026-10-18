/**
 * The versions of a clip: the clip a line of new prompts started from and every variation made from
 * it since, oldest first, or as a family tree (each take under the clip it was made from). A cut
 * (`split`) starts a line of its own. Given the clip pool, gives clips; knows nothing of the page.
 */
import type { Clip } from '../../shared/clip.schema.ts';

/**
 * Returns the line of versions a clip is in: the clip the line started from and every variation made
 * from it since.
 *
 * @param clipId - The id of the clip.
 * @param clips - The clip pool.
 * @returns The versions, oldest first; just the clip when it has none, and none when the clip is not
 * in the pool.
 */
export function getVersions(clipId: string, clips: Clip[]): Clip[] {
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  let root = clipsById.get(clipId);
  if (!root) return [];
  const seen = new Set([root.id]);
  while (root.parent?.relation === 'variation') {
    const parent = clipsById.get(root.parent.clip);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    root = parent;
  }
  const line = [root];
  for (let i = 0; i < line.length; i++) {
    const current = line[i];
    if (!current) break;
    line.push(
      ...clips.filter(
        (clip) =>
          clip.parent?.relation === 'variation' &&
          clip.parent.clip === current.id &&
          !line.includes(clip),
      ),
    );
  }
  return line.sort((first, second) => first.created.localeCompare(second.created));
}

/** A version of a clip in its family tree: the clip, and how many takes deep it is (the original 0). */
export type VersionRow = { clip: Clip; depth: number };

/**
 * Returns the family tree a clip is in: the original first, then each take under the clip it was
 * made from, the takes of one clip oldest first.
 *
 * @param clipId - The id of any clip of the family.
 * @param clips - The clip pool.
 * @returns The versions in the tree's order, each with its depth; none when the clip is not in the
 *   pool.
 */
export function getVersionTree(clipId: string, clips: Clip[]): VersionRow[] {
  const family = getVersions(clipId, clips);
  function isChildOf(clip: Clip, parentId: string): boolean {
    return clip.parent?.relation === 'variation' && clip.parent.clip === parentId;
  }
  const root = family.find((clip) => !family.some((other) => isChildOf(clip, other.id)));
  function getRows(clip: Clip, depth: number): VersionRow[] {
    const children = family.filter((other) => isChildOf(other, clip.id));
    return [{ clip, depth }, ...children.flatMap((child) => getRows(child, depth + 1))];
  }
  return root ? getRows(root, 0) : [];
}
