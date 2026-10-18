/**
 * What a clip says of its channels: their names, read from its chips, whether a channel's notes are
 * pitches, and whether it is a whole piece (made from a prompt or imported) that can be split into
 * its channels. Knows nothing of files
 * or the page.
 */
import { FURNACE_CHIPS } from './chips.ts';
import type { Clip } from './clip.types.ts';

/**
 * Returns the name of a channel.
 *
 * @param chips - The clip's chips, by name, in order ("NES", "SCC+").
 * @param channel - The channel's number, counted over the chips in order.
 * @returns Its name, like "Triangle" or "SCC 2"; "Channel 7" past the chips known. A chip that comes
 *   again numbers on ("SCC 6" for the second SCC's first), or, with channels not numbered, has its
 *   count after the name ("Pulse 1 (NES 2)").
 */
export function getChannelName(chips: string[], channel: number): string {
  const names = chips.flatMap((name, i) => {
    const channelNames = FURNACE_CHIPS.find((chip) => chip.name === name)?.channelNames ?? [];
    const before = chips.slice(0, i).filter((other) => other === name).length;
    return before === 0 ? channelNames : getRepeatedNames(name, channelNames, before);
  });
  return names[channel] ?? `Channel ${channel + 1}`;
}

/**
 * Tells whether a channel's notes are pitches, to be transposed: not a noise or sample channel.
 *
 * @param chips - The clip's chips, by name, in order ("NES", "SCC+").
 * @param channel - The channel's number, counted over the chips in order.
 * @returns Whether its notes are pitches; true past the chips known.
 */
export function isPitchedChannel(chips: string[], channel: number): boolean {
  let first = 0;
  for (const name of chips) {
    const chip = FURNACE_CHIPS.find((known) => known.name === name);
    const count = chip?.channelNames.length ?? 0;
    if (chip && channel < first + count) return !chip.unpitchedChannels.includes(channel - first);
    first += count;
  }
  return true;
}

/** A channel's name that ends in its number: `SCC 3`. */
const NUMBERED_NAME = /^(.*) (\d+)$/;

/**
 * Returns the channel names of a chip that comes again.
 *
 * @param chipName - The chip's name.
 * @param channelNames - Its channels' names.
 * @param before - How many times it came before.
 * @returns The names numbered on past those before, or with the chip's count after them.
 */
function getRepeatedNames(chipName: string, channelNames: string[], before: number): string[] {
  return channelNames.map((name) => {
    const numbered = NUMBERED_NAME.exec(name);
    if (numbered?.[1] && numbered[2]) {
      return `${numbered[1]} ${Number(numbered[2]) + before * channelNames.length}`;
    }
    return `${name} (${chipName} ${before + 1})`;
  });
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
