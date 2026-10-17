/**
 * The versions of a clip: the clip a line of new prompts started from and every variation made from
 * it since, oldest first. A cut (`split`) starts a line of its own. Given the clip pool, gives
 * clips; knows nothing of the page.
 */
import type { Clip } from '../../shared/clip.types.ts';

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
