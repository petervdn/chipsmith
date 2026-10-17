/**
 * The snap grid of the timeline: the steps a block snaps to when it is moved or trimmed, from a bar
 * down to a sixteenth, or none. Knows nothing of the page.
 */
import { TICKS_PER_BEAT } from '../../shared/song.types.ts';

/** A step of the grid: its name and its length, in ticks; 0 is no snapping, null a whole bar. */
export type GridStep = { id: string; name: string; ticks: number | null };

/** A bar: the step the editor starts with. */
export const BAR_STEP: GridStep = { id: 'bar', name: 'bar', ticks: null };

/** The steps, coarsest first. */
export const GRID_STEPS: GridStep[] = [
  BAR_STEP,
  { id: 'beat', name: 'beat', ticks: TICKS_PER_BEAT },
  { id: 'eighth', name: '1/8', ticks: TICKS_PER_BEAT / 2 },
  { id: 'sixteenth', name: '1/16', ticks: TICKS_PER_BEAT / 4 },
  { id: 'off', name: 'off', ticks: 0 },
];

/**
 * Returns a time snapped to the nearest step of the grid.
 *
 * @param ticks - The time, in ticks.
 * @param step - The grid's step.
 * @param ticksPerBar - The song's ticks to a bar, for a step of a bar.
 * @returns The time on the nearest step; the time rounded to a tick when the grid is off.
 */
export function snapToGrid(ticks: number, step: GridStep, ticksPerBar: number): number {
  const size = step.ticks ?? ticksPerBar;
  if (size === 0) return Math.round(ticks);
  return Math.round(ticks / size) * size;
}

/**
 * Returns the length of one step of the grid.
 *
 * @param step - The grid's step.
 * @param ticksPerBar - The song's ticks to a bar, for a step of a bar.
 * @returns The step's length in ticks; 1 when the grid is off.
 */
export function getStepTicks(step: GridStep, ticksPerBar: number): number {
  const size = step.ticks ?? ticksPerBar;
  return size === 0 ? 1 : size;
}
