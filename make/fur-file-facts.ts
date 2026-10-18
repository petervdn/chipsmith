/**
 * What a .fur file says of its music: its tempo, beats to a bar, chips, the channels that play and
 * its length, which are a clip's facts (docs/adr/0024). Given a .fur file, gives values.
 */
import { getFurnaceChip } from '../shared/chips.ts';
import type { ClipFacts } from '../shared/clip.schema.ts';
import { getPlayingChannels } from '../fur/cut.ts';
import type { FurFile, FurSong } from '../fur/fur.types.ts';

/**
 * Returns a song's tempo as Furnace shows it: rows to a beat from the first highlight, sped by the
 * virtual tempo.
 *
 * @param song - The song's settings.
 * @param song.tickRate - Ticks a second.
 * @param song.speeds - Ticks to a row, averaged when there are several.
 * @param song.highlights - The highlights; the first is rows to a beat, 4 when it is 0.
 * @param song.virtualTempo - The virtual tempo, whose numerator over its denominator speeds the tempo.
 * @returns Beats a minute, rounded to two decimals.
 */
export function getBpm({ tickRate, speeds, highlights, virtualTempo }: FurSong): number {
  const ticksPerRow = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  const rowsPerBeat = highlights.first || 4;
  const bpm = (tickRate * 60) / (ticksPerRow * rowsPerBeat);
  return Math.round(((bpm * virtualTempo.numerator) / virtualTempo.denominator) * 100) / 100;
}

/**
 * Returns a song's beats to a bar: the second highlight in beats of the first.
 *
 * @param song - The song's settings.
 * @param song.highlights - The highlights: rows to a beat (4 when it is 0) and rows to a bar.
 * @returns Beats to a bar, rounded, and at least 1.
 */
export function getBeatsPerBar({ highlights }: FurSong): number {
  return Math.max(1, Math.round(highlights.second / (highlights.first || 4)));
}

/**
 * Returns the names of a song's chips.
 *
 * @param song - The song's settings.
 * @param song.chips - Furnace's ids of the chips.
 * @returns Each chip's name, or its id in hex when it has none.
 */
export function getChipNames({ chips }: FurSong): string[] {
  return chips.map((chip) => getFurnaceChip(chip)?.name ?? `0x${chip.toString(16)}`);
}

/**
 * Returns a song's length: its orders' rows at its speed. The song is taken to play every row of
 * every order once, without jumps or changes of speed in its patterns, as this project writes them.
 *
 * @param song - The song's settings.
 * @param song.tickRate - Ticks a second.
 * @param song.speeds - Ticks to a row, averaged when there are several.
 * @param song.virtualTempo - The virtual tempo, whose numerator over its denominator speeds it up.
 * @param song.patternLength - Rows to a pattern.
 * @param song.orders - For each channel, the pattern at each order.
 * @returns The length in seconds.
 */
export function getFurSeconds({
  tickRate,
  speeds,
  virtualTempo,
  patternLength,
  orders,
}: FurSong): number {
  const ticksPerRow = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  const rows = (orders[0]?.length ?? 0) * patternLength;
  return (rows * ticksPerRow * virtualTempo.denominator) / (tickRate * virtualTempo.numerator);
}

/**
 * Returns what a .fur file says of its music, as a clip's facts.
 *
 * @param furFile - The .fur file.
 * @returns Its tempo, beats to a bar, chips, the channels that play, and its length.
 */
export function getClipFacts(furFile: FurFile): ClipFacts {
  return {
    bpm: getBpm(furFile.song),
    beats: getBeatsPerBar(furFile.song),
    chips: getChipNames(furFile.song),
    channels: getPlayingChannels(furFile),
    seconds: getFurSeconds(furFile.song),
  };
}
