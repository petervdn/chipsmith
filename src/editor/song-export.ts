/**
 * What a song's export is made of: the name its file is saved as, how loud each track goes into
 * the mix, and about how big the file will be. Knows nothing of audio or the page.
 */
import type { ExportFormat } from '../../shared/audio-export.ts';
import type { Track } from '../../shared/song.schema.ts';
import { TRACK_LOUDEST_DB, getGain } from '../player/volume.ts';

/** The characters a file's name cannot have on some system, each put as a dash. */
const UNSAFE_CHARACTERS = /[/\\:*?"<>|]/g;

/**
 * Returns the name an exported song is saved as: its title, without what a file's name cannot
 * hold, and the file type's ending.
 *
 * @param title - The song's title.
 * @param format - The file type.
 * @returns The file's name.
 */
export function getExportFileName(title: string, format: ExportFormat): string {
  const name = title.replace(UNSAFE_CHARACTERS, '-').trim() || 'song';
  return `${name}.${format.extension}`;
}

/**
 * Returns each track's gain in the mix: its fader's, as the player plays it, or 0 for a track left
 * out.
 *
 * @param tracks - The song's tracks, as edited.
 * @param leftOutTrackIds - The ids of the tracks left out of the mix.
 * @returns Each track's gain, by its id.
 */
export function getExportTrackGains(
  tracks: Track[],
  leftOutTrackIds: string[],
): Record<string, number> {
  return Object.fromEntries(
    tracks.map((track) => [
      track.id,
      leftOutTrackIds.includes(track.id) ? 0 : getGain(track.volume, TRACK_LOUDEST_DB),
    ]),
  );
}

/**
 * Returns how far a mix's peak is over full scale.
 *
 * @param peak - The mix's loudest sample.
 * @returns The decibels over full scale, rounded to a tenth, or null when it is not over.
 */
export function getDecibelsOver(peak: number): number | null {
  if (peak <= 1) return null;
  return Math.round(20 * Math.log10(peak) * 10) / 10;
}

/** Bytes to a megabyte, as a file's size is shown. */
const MEGABYTE = 1000000;
/** Sizes from this many megabytes on are shown without a decimal. */
const WHOLE_MEGABYTES = 10;

/**
 * Returns about how big an export will be, as it is shown.
 *
 * @param format - The file type.
 * @param seconds - How long the export is.
 * @returns The size in megabytes ("7.9 MB"), or the range it falls in ("1.2–3.2 MB").
 */
export function getExportSizeText(format: ExportFormat, seconds: number): string {
  const fewest = getMegabytesText(format.bytesPerSecond.fewest * seconds);
  const most = getMegabytesText(format.bytesPerSecond.most * seconds);
  return fewest === most ? `${most} MB` : `${fewest}–${most} MB`;
}

function getMegabytesText(bytes: number): string {
  const megabytes = bytes / MEGABYTE;
  return megabytes >= WHOLE_MEGABYTES ? String(Math.round(megabytes)) : megabytes.toFixed(1);
}
