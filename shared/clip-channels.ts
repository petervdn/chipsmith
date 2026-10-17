/**
 * What a clip says of its channels: their names, read from its chips, and whether it is a whole
 * piece (made from a prompt or imported) that can be split into its channels. Knows nothing of files
 * or the page.
 */
import { FURNACE_CHIPS } from './chips.ts';
import type { Clip } from './clip.types.ts';

/**
 * Returns the name of a channel.
 *
 * @param chips - The clip's chips, by name, in order ("NES", "SCC+").
 * @param channel - The channel's number, counted over the chips in order.
 * @returns Its name, like "Triangle" or "SCC 2"; "Channel 7" past the chips known.
 */
export function getChannelName(chips: string[], channel: number): string {
  const names = chips.flatMap(
    (name) => FURNACE_CHIPS.find((chip) => chip.name === name)?.channelNames ?? [],
  );
  return names[channel] ?? `Channel ${channel + 1}`;
}

/**
 * Tells whether a clip is a whole piece: not cut out of another and covering all its bars.
 *
 * @param clip - The clip.
 * @returns Whether it is whole.
 */
export function isWholeClip(clip: Clip): boolean {
  return clip.parent?.relation !== 'split' && clip.bars === null;
}

/**
 * Returns how many channels a whole clip can be split into.
 *
 * @param clip - The clip.
 * @returns The channels that play in it, when it is whole and more than one; else 0.
 */
export function getSplitCount(clip: Clip): number {
  if (!isWholeClip(clip) || clip.channels.length < 2) return 0;
  return clip.channels.length;
}
