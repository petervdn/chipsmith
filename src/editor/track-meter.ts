/**
 * How a track's level meter moves, as a modern DAW's does: it jumps at once to a louder level and
 * eases back down from it, and a peak mark stays a while at the loudest before it falls, faster as
 * it goes. Levels are in decibels from full scale, with headroom above full scale at the top as a
 * DAW's meter has; knows no audio and no page.
 */

/** The quietest level shown, in decibels: the meter's bottom. */
export const FLOOR_DECIBELS = -48;
/** The loudest level shown, in decibels: the meter's top, above full scale so a level near it has room. */
export const CEILING_DECIBELS = 6;
/** Seconds in which the level eases most of the way (63%) down to a quieter one. */
const RELEASE_SECONDS = 0.15;
/** Seconds a peak mark stays where it is before it falls. */
const PEAK_HOLD_SECONDS = 1.2;
/** How fast a falling peak mark speeds up, in decibels per second, every second. */
const PEAK_FALL_ACCELERATION = 60;
/** How near the floor, in decibels, a meter counts as settled. */
const SETTLED_DECIBELS = 0.1;

/** Where a meter stands. */
export type MeterState = {
  /** The level shown, in decibels. */
  level: number;
  /** The peak mark, in decibels. */
  peak: number;
  /** How long the peak mark has stood, in seconds. */
  peakAge: number;
  /** How fast the peak mark falls, in decibels per second. */
  peakSpeed: number;
};

/** A meter at its floor. */
export const SILENT_METER: MeterState = {
  level: FLOOR_DECIBELS,
  peak: FLOOR_DECIBELS,
  peakAge: 0,
  peakSpeed: 0,
};

/**
 * Returns an amplitude in decibels from full scale, no quieter than the floor.
 *
 * @param amplitude - The amplitude, 1 at full scale.
 * @returns The level in decibels, from FLOOR_DECIBELS up.
 */
export function getDecibels(amplitude: number): number {
  return amplitude > 0 ? Math.max(FLOOR_DECIBELS, 20 * Math.log10(amplitude)) : FLOOR_DECIBELS;
}

/**
 * Returns where a meter stands after a step of time with a level coming in.
 *
 * @param meter - Where it stood.
 * @param input - The level coming in, in decibels.
 * @param seconds - The time since it stood there.
 * @returns Where it stands now.
 */
export function stepMeter(meter: MeterState, input: number, seconds: number): MeterState {
  const level =
    input >= meter.level
      ? input
      : input + (meter.level - input) * Math.exp(-seconds / RELEASE_SECONDS);
  if (level >= meter.peak) return { level, peak: level, peakAge: 0, peakSpeed: 0 };
  const peakAge = meter.peakAge + seconds;
  if (peakAge < PEAK_HOLD_SECONDS) return { ...meter, level, peakAge };
  const peakSpeed = meter.peakSpeed + PEAK_FALL_ACCELERATION * seconds;
  return { level, peak: Math.max(level, meter.peak - peakSpeed * seconds), peakAge, peakSpeed };
}

/**
 * Returns how far up the meter a level is drawn.
 *
 * @param decibels - The level, in decibels.
 * @returns The share of the meter's height, 0 at the floor to 1 at the ceiling.
 */
export function getMeterShare(decibels: number): number {
  const share = (decibels - FLOOR_DECIBELS) / (CEILING_DECIBELS - FLOOR_DECIBELS);
  return Math.min(1, Math.max(0, share));
}

/**
 * Tells whether a meter has fallen to its floor, level and peak mark both.
 *
 * @param meter - Where it stands.
 * @returns True when there is nothing more to draw.
 */
export function isSettled(meter: MeterState): boolean {
  return Math.max(meter.level, meter.peak) <= FLOOR_DECIBELS + SETTLED_DECIBELS;
}
