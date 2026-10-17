/**
 * New ids for clips, songs, jobs and guides: a letter and the next free number (`c0001`, `s0001`). The id's folder
 * is made at once and fails if it is there, so two makers never get the same id.
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** The id of a kind: its letter and its folder under the data root. */
export type IdKind = {
  letter: 'c' | 's' | 'j' | 'g';
  folder: 'clips' | 'songs' | 'jobs' | 'guides';
};

/** Clips: `clips/c0001/`. */
export const CLIP_IDS: IdKind = { letter: 'c', folder: 'clips' };
/** Songs: `songs/s0001/`. */
export const SONG_IDS: IdKind = { letter: 's', folder: 'songs' };
/** Jobs: `jobs/j0001/`. */
export const JOB_IDS: IdKind = { letter: 'j', folder: 'jobs' };
/** Style guides: `guides/g0001/`. */
export const GUIDE_IDS: IdKind = { letter: 'g', folder: 'guides' };
const DIGITS = 4;

/** Makes the folder of the next free id under `root` and gives the id. */
export function claimId(root: string, { letter, folder }: IdKind): string {
  const parent = join(root, folder);
  mkdirSync(parent, { recursive: true });
  let number = getHighestNumber(parent, letter) + 1;
  for (;;) {
    const id = `${letter}${String(number).padStart(DIGITS, '0')}`;
    try {
      mkdirSync(join(parent, id));
      return id;
    } catch (error) {
      if (!existsSync(join(parent, id))) throw error;
      number += 1;
    }
  }
}

function getHighestNumber(parent: string, letter: string): number {
  const pattern = new RegExp(`^${letter}(\\d+)$`);
  return readdirSync(parent).reduce((highest, name) => {
    const match = pattern.exec(name);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}
