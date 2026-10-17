/**
 * A loop: a stretch of a song played over and over. The first pass plays from where play starts to
 * the loop's end; every pass after it plays the loop from its start, straight after the one before,
 * on one clock that runs on (the play's own seconds), so the passes join without a gap. Given
 * seconds, gives seconds; knows no audio and no page.
 */

/** A loop's start and end, in seconds of the song. */
export type Loop = { start: number; end: number };

/** A pass of a loop, after the first: where it plays on the play's clock, and how far it is moved. */
export type LoopPass = {
  /** When it starts, in seconds on the play's clock. */
  at: number;
  /** How far the loop's seconds are moved to play there: `at` minus the loop's start. */
  shift: number;
};

/**
 * Returns where play starts in a song with a loop: where it was asked to, unless that is at or past
 * the loop's end, which starts it at the loop's start.
 *
 * @param from - The second play was asked to start at.
 * @param loop - The loop.
 * @returns The second play starts at.
 */
export function getLoopFrom(from: number, loop: Loop): number {
  return from >= loop.end ? loop.start : from;
}

/**
 * Returns a pass of a loop, after the first.
 *
 * @param loop - The loop.
 * @param pass - Which pass: 1 for the one straight after the first, and on.
 * @returns Where it plays and how far it is moved.
 */
export function getLoopPass(loop: Loop, pass: number): LoopPass {
  const at = loop.end + (pass - 1) * (loop.end - loop.start);
  return { at, shift: at - loop.start };
}

/**
 * Returns the second of the song that plays at a second of the play's clock.
 *
 * @param played - The second on the play's clock (the song's second, for the first pass).
 * @param loop - The loop, or null for none.
 * @returns The second of the song: past the loop's end, the place in the loop it has come round to.
 */
export function getLoopedSecond(played: number, loop: Loop | null): number {
  if (!loop || played < loop.end) return played;
  const length = loop.end - loop.start;
  if (length <= 0) return loop.start;
  return loop.start + ((played - loop.end) % length);
}
