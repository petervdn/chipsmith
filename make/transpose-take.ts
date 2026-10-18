/**
 * A take of a clip made by transposing it (docs/adr/0037), without Claude: its pitched channels'
 * notes moved by semitones, labelled by how far ("octave up", "down 2 semitones"). It has no script,
 * as none wrote it; a later prompt on it works from its source.fur.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPitchedChannel } from '../shared/clip-channels.ts';
import type { Clip } from '../shared/clip.types.ts';
import { readFurFile } from '../fur/read.ts';
import { transposeFurFile } from '../fur/transpose.ts';
import { makeTake } from './make-take.ts';

/** Semitones to an octave. */
const OCTAVE = 12;

/**
 * Returns how a transposed take is labelled.
 *
 * @param semitones - How far it was moved, up or down; not 0.
 * @returns "octave up", "two octaves down", "up 1 semitone", "down 5 semitones".
 */
export function getTransposeLabel(semitones: number): string {
  const direction = semitones > 0 ? 'up' : 'down';
  const size = Math.abs(semitones);
  if (size === OCTAVE) return `octave ${direction}`;
  if (size === OCTAVE * 2) return `two octaves ${direction}`;
  return `${direction} ${size} ${size === 1 ? 'semitone' : 'semitones'}`;
}

/**
 * Makes a take of a clip transposed: its source.fur with the notes of its pitched channels moved,
 * rendered, and kept as a variation of it.
 *
 * @param take - What it is made of.
 * @param take.root - The data folder.
 * @param take.parent - The clip transposed.
 * @param take.songId - The song it was asked in.
 * @param take.semitones - How far to move its notes, up or down.
 * @returns The id of the clip made; an error when a note would go past what Furnace plays.
 */
export async function makeTransposedTake({
  root,
  parent,
  songId,
  semitones,
}: {
  root: string;
  parent: Clip;
  songId: string;
  semitones: number;
}): Promise<string> {
  const furFile = readFurFile(readFileSync(join(root, 'clips', parent.id, 'source.fur')));
  const channels = Array.from({ length: furFile.song.channelCount }, (_unused, i) => i).filter(
    (channel) => isPitchedChannel(parent.chips, channel),
  );
  return makeTake({
    root,
    parent,
    channels: null,
    songId,
    furFile: transposeFurFile(furFile, semitones, channels),
    label: getTransposeLabel(semitones),
    scriptFile: null,
    tags: [],
    key: semitones % OCTAVE === 0 ? parent.key : null,
  });
}
