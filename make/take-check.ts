/**
 * Whether a take fits the clip it is a take of (docs/adr/0037): the same chips and tempo, so it
 * plays in time with the song's other tracks, and notes to play; a length of its own is only noted,
 * as a prompt may ask for one. Given the facts of both, gives what is wrong; knows nothing of files.
 */
import type { ClipFacts } from '../shared/clip.schema.ts';

/** How far two tempos, or two lengths in seconds, may differ and count as the same. */
const TOLERANCE = 0.01;

/** What a take's check found: what makes it not fit, and what is only worth knowing. */
export type TakeCheck = { problems: string[]; notes: string[] };

/**
 * Checks a take, as it will be kept, against the clip it is a take of.
 *
 * @param take - The take's facts, read from its .fur file as it is kept.
 * @param clip - The clip's facts.
 * @returns What makes it not fit (problems) and what is only noted (notes).
 */
export function checkTake(take: ClipFacts, clip: ClipFacts): TakeCheck {
  const problems: string[] = [];
  const notes: string[] = [];
  if (take.chips.join(' + ') !== clip.chips.join(' + ')) {
    problems.push(`plays on ${take.chips.join(' + ')}, the clip on ${clip.chips.join(' + ')}`);
  }
  if (Math.abs(take.bpm - clip.bpm) > TOLERANCE) {
    problems.push(`is at ${round(take.bpm)} bpm, the clip at ${round(clip.bpm)}`);
  }
  if (take.channels.length === 0) problems.push('plays no notes');
  if (Math.abs(take.seconds - clip.seconds) > TOLERANCE) {
    notes.push(
      `is ${take.seconds.toFixed(1)} s, the clip ${clip.seconds.toFixed(1)} s (fine only if the prompt asks for another length)`,
    );
  }
  return { problems, notes };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
