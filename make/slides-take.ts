/**
 * A take of a clip without its slides (docs/adr/0037), made without Claude: its source.fur with every
 * pitch slide taken out (`fur/slides.ts`), labelled "no slides". It has no script, as none wrote it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Clip } from '../shared/clip.schema.ts';
import { readFurFile } from '../fur/read.ts';
import { getSlideCount, removeSlides } from '../fur/slides.ts';
import { makeTake } from './make-take.ts';

/**
 * Makes a take of a clip without its slides: rendered, and kept as a variation of it.
 *
 * @param take - What it is made of.
 * @param take.root - The data folder.
 * @param take.parent - The clip.
 * @param take.songId - The song it was asked in.
 * @returns The id of the clip made; an error when the clip has no slides.
 */
export async function makeTakeWithoutSlides({
  root,
  parent,
  songId,
}: {
  root: string;
  parent: Clip;
  songId: string;
}): Promise<string> {
  const furFile = readFurFile(readFileSync(join(root, 'clips', parent.id, 'source.fur')));
  if (getSlideCount(furFile) === 0) throw new Error(`${parent.id} has no slides to take out`);
  return makeTake({
    root,
    parent,
    channels: null,
    songId,
    furFile: removeSlides(furFile),
    label: 'no slides',
    scriptFile: null,
    tags: [],
    key: parent.key,
  });
}
