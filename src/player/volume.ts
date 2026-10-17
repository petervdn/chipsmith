/**
 * The player's volume, set in decibels so that equal steps of the slider sound like equal steps of
 * loudness: from 0 dB (as rendered) down to the slider's lowest step, which is silence. Knows
 * nothing of the page or of audio.
 */

/** The loudest the volume goes, in decibels: the audio as rendered. */
export const LOUDEST_DB = 0;
/** The slider's lowest step, in decibels; it is silence. */
export const QUIETEST_DB = -48;

/**
 * Returns the gain a volume in decibels multiplies the audio by.
 *
 * @param decibels - The volume, from QUIETEST_DB to LOUDEST_DB.
 * @returns The gain: 1 at 0 dB, about 0.5 at −6 dB, and 0 at QUIETEST_DB or lower.
 */
export function getGain(decibels: number): number {
  if (decibels <= QUIETEST_DB) return 0;
  return 10 ** (Math.min(LOUDEST_DB, decibels) / 20);
}

/**
 * Returns how a volume is shown.
 *
 * @param decibels - The volume, in decibels.
 * @returns "0 dB", "−12 dB", or "off" at the lowest step.
 */
export function formatVolume(decibels: number): string {
  if (decibels <= QUIETEST_DB) return 'off';
  return `${Math.round(decibels) === 0 ? '0' : `−${Math.abs(Math.round(decibels))}`} dB`;
}
