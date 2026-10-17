/** How numbers are shown on the page: a length in minutes and seconds, a meter, tokens. */

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

/** The least a count of some tokens shows, in thousands: a few tokens are never "0k". */
const MIN_THOUSANDS = 0.1;

/**
 * Returns a number of tokens as a short count, always in thousands: with a decimal below ten
 * thousand, and never less than 0.1k for some.
 *
 * @param tokens - The tokens.
 * @returns "0.9k", "1.2k" or "15k"; "0k" for none.
 */
export function formatTokenCount(tokens: number): string {
  if (tokens <= 0) return '0k';
  const thousands = tokens / 1000;
  if (thousands >= 10) return `${Math.round(thousands)}k`;
  return `${Math.max(MIN_THOUSANDS, Math.round(thousands * 10) / 10)}k`;
}

/**
 * Returns a number of tokens as it is shown: its short count and the word.
 *
 * @param tokens - The tokens.
 * @returns "0.9k tokens", "1.2k tokens" or "15k tokens".
 */
export function formatTokens(tokens: number): string {
  return `${formatTokenCount(tokens)} tokens`;
}
