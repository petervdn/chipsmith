/** How numbers are shown on the page: a length in minutes and seconds, a meter. */

/**
 * Returns a length in minutes and seconds: "1:05" for 65 seconds.
 *
 * @param seconds - The length, in seconds (rounded to whole seconds).
 * @returns The length as minutes, a colon and two digits of seconds.
 */
export function formatSeconds(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * Returns a meter as it is written: "4/4" for four beats to a bar.
 *
 * @param beats - The number of beats to a bar.
 * @returns The meter, the beats over 4.
 */
export function formatMeter(beats: number): string {
  return `${beats}/4`;
}

/**
 * Returns a number of tokens as it is shown: in thousands from a thousand on.
 *
 * @param tokens - The tokens.
 * @returns "850 tokens", "15k tokens" or "1.2k tokens".
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`;
  const thousands = tokens / 1000;
  return `${thousands < 10 ? Math.round(thousands * 10) / 10 : Math.round(thousands)}k tokens`;
}
