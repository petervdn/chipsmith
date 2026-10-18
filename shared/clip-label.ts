/**
 * A clip's name as the page and the files it is given out as show it: its section and stem, or
 * "whole" for a clip that was not cut. Knows nothing of files or the page.
 */
import type { Clip } from './clip.schema.ts';

/**
 * Returns a clip's name as it is shown.
 *
 * @param clip - The clip.
 * @param clip.name - The clip's name, its section and stem.
 * @returns The section and stem, or "whole" for an unsplit clip.
 */
export function getClipLabel({ name }: Clip): string {
  const label = [name.section, name.stem].filter(Boolean).join(' ');
  return label || 'whole';
}
