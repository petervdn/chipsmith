/**
 * A song's stretches mixed down to one piece of audio, rendered offline with Web Audio as fast as
 * the device can: the same clips' audio the player plays, each track at a gain of its own; the whole
 * song, or a loop played a number of times. Knows
 * nothing of files or the page.
 */
import { getContext, loadAudio } from './audio-engine.ts';
import type { Stretch } from './schedule.ts';
import { getEnd, getFittedStretches, getLoopedPieces, getPieces } from './schedule.ts';

/** The channels of a mix. */
const CHANNEL_COUNT = 2;

/** What a mixdown plays: the stretches, where their audio is, and how loud each track is. */
export type MixdownRequest = {
  stretches: Stretch[];
  getUrl: (clipId: string) => string;
  /** Each track's gain (1 as it was rendered, 0 left out), by its id; a track not in it is left out. */
  trackGains: Record<string, number>;
  /** The loop to play, in seconds of the song, and how many times; null for the whole song. */
  loop: { start: number; end: number; times: number } | null;
};

/**
 * Renders a mixdown: from the song's start to the end of its last stretch, or a loop's passes.
 *
 * @param request - What is mixed.
 * @param request.stretches - The stretches the song plays.
 * @param request.getUrl - Returns the URL of a clip's audio from its id.
 * @param request.trackGains - Each track's gain, by its id.
 * @param request.loop - The loop and how many times it plays, or null for the whole song.
 * @returns The rendered audio, at the page's audio's sample rate.
 */
export async function renderMixdown({
  stretches,
  getUrl,
  trackGains,
  loop,
}: MixdownRequest): Promise<AudioBuffer> {
  const heard = stretches.filter((stretch) => (trackGains[stretch.trackId] ?? 0) > 0);
  const urls = [...new Set(heard.map((stretch) => getUrl(stretch.clipId)))];
  const decoded = new Map(
    await Promise.all(
      urls.map(async (url) => {
        const entry: [string, AudioBuffer] = [url, await loadAudio(url)];
        return entry;
      }),
    ),
  );
  const fitted = getFittedStretches(heard, (clipId) => decoded.get(getUrl(clipId))?.duration);
  const { sampleRate } = getContext();
  const pieces = loop
    ? getLoopedPieces(fitted, loop, loop.times)
    : getPieces(fitted, 0, getEnd(fitted), 0);
  const end = loop ? (loop.end - loop.start) * loop.times : getEnd(fitted);
  const offline = new OfflineAudioContext(
    CHANNEL_COUNT,
    Math.max(1, Math.ceil(end * sampleRate)),
    sampleRate,
  );
  const trackInputs = new Map<string, GainNode>();
  for (const piece of pieces) {
    const buffer = decoded.get(getUrl(piece.clipId));
    if (!buffer) continue;
    let input = trackInputs.get(piece.trackId);
    if (!input) {
      input = offline.createGain();
      input.gain.value = trackGains[piece.trackId] ?? 0;
      input.connect(offline.destination);
      trackInputs.set(piece.trackId, input);
    }
    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(input);
    source.start(piece.at, piece.offset, piece.duration);
  }
  return offline.startRendering();
}
