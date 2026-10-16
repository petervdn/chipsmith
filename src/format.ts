/** How numbers are shown on the page: a length in minutes and seconds, a meter. */

/** "1:05" for 65 seconds. */
export function formatSeconds(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** "4/4" for four beats to a bar. */
export function formatMeter(beats: number): string {
  return `${beats}/4`;
}
