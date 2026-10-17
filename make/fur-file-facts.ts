/**
 * What a .fur file's settings say of its music: its tempo, beats to a bar and chips, as a clip records
 * them. Given a FurSong, gives values.
 */
import type { FurSong } from '../fur/fur.types.ts';

/** Furnace's chip ids and the names a clip gives them. */
const CHIP_NAMES = new Map([
  [0x06, 'NES'],
  [0xb4, 'SCC+'],
  [0xa1, 'SCC'],
]);

/** Beats a minute, as Furnace shows it: rows a beat from the first highlight, sped by the virtual tempo. */
export function getBpm({ tickRate, speeds, highlights, virtualTempo }: FurSong): number {
  const ticksPerRow = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  const rowsPerBeat = highlights.first || 4;
  const bpm = (tickRate * 60) / (ticksPerRow * rowsPerBeat);
  return Math.round(((bpm * virtualTempo.numerator) / virtualTempo.denominator) * 100) / 100;
}

/** Beats to a bar: the second highlight in beats of the first. */
export function getBeatsPerBar({ highlights }: FurSong): number {
  return Math.max(1, Math.round(highlights.second / (highlights.first || 4)));
}

/** The chips' names. */
export function getChipNames({ chips }: FurSong): string[] {
  return chips.map((chip) => CHIP_NAMES.get(chip) ?? `0x${chip.toString(16)}`);
}
