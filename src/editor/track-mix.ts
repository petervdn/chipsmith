/**
 * Which tracks are heard: none that is muted, and only the soloed ones while any is. Knows nothing
 * of the page.
 */
import type { Track } from '../../shared/song.types.ts';

/** The tracks muted and soloed, by id. */
export type TrackMix = { muted: string[]; soloed: string[] };

/** No track muted or soloed. */
export const EMPTY_MIX: TrackMix = { muted: [], soloed: [] };

/**
 * Returns whether a track is heard.
 *
 * @param trackId - The track.
 * @param mix - The tracks muted and soloed.
 * @param mix.muted - The ids of the tracks muted.
 * @param mix.soloed - The ids of the tracks soloed.
 * @returns False when it is muted, or when another is soloed and it is not.
 */
export function isHeard(trackId: string, { muted, soloed }: TrackMix): boolean {
  if (muted.includes(trackId)) return false;
  return soloed.length === 0 || soloed.includes(trackId);
}

/**
 * Returns the ids of the tracks that are not heard.
 *
 * @param tracks - The song's tracks.
 * @param mix - The tracks muted and soloed.
 * @returns The ids of the tracks not heard, in their order.
 */
export function getUnheardTrackIds(tracks: Track[], mix: TrackMix): string[] {
  return tracks.filter((track) => !isHeard(track.id, mix)).map((track) => track.id);
}
