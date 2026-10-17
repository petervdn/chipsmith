/**
 * Each track of what plays on a tap of its own on the way to the output: its gain, which sets its
 * level (its fader) and mutes the tracks not heard (mute and solo) at once, also while playing, and
 * its peak after that gain, for its level meter. Before the player's mute switch. Knows nothing of what is shown.
 */

/** Samples read at a time: about 21 ms at 48 kHz, longer than a frame, so no peak falls between. */
const SAMPLE_COUNT = 1024;
/** Seconds in which a track's gain moves most of the way to a new one, so muting does not click. */
const GAIN_SMOOTHING = 0.005;

import { TRACK_LOUDEST_DB, getGain as getVolumeGain } from '../player/volume.ts';

/** A track's tap: what its sources play into, and its two channels' analysers. */
type TrackTap = { input: GainNode; analysers: AnalyserNode[] };

let taps = new Map<string, TrackTap>();
/** The tracks not heard, kept across plays. */
let unheardTrackIds = new Set<string>();
/** Each track's level in decibels, by its id, kept across plays; a track not in it plays at 0 dB. */
let trackVolumes: Record<string, number> = {};
const samples = new Float32Array(SAMPLE_COUNT);

/**
 * Returns the node a track's sources play into, made the first time it is asked for in a play.
 *
 * @param context - The audio context.
 * @param trackId - The id of the track.
 * @param output - Where the track's audio goes on to.
 * @returns The track's tap's input.
 */
export function getTrackInput(
  context: AudioContext,
  trackId: string,
  output: AudioNode,
): AudioNode {
  const tap = taps.get(trackId) ?? makeTap(context, trackId, output);
  taps.set(trackId, tap);
  return tap.input;
}

/**
 * Sets which tracks are not heard, at once for the tracks playing and for the next plays.
 *
 * @param trackIds - The ids of the tracks not heard; none to hear every track.
 */
export function setUnheardTracks(trackIds: string[]): void {
  unheardTrackIds = new Set(trackIds);
  setTapGains();
}

/**
 * Sets each track's level, at once for the tracks playing and for the next plays.
 *
 * @param volumes - Each track's level in decibels, by its id.
 */
export function setTrackVolumes(volumes: Record<string, number>): void {
  trackVolumes = volumes;
  setTapGains();
}

/** Moves every playing track's gain to what its level and mute or solo make it. */
function setTapGains(): void {
  for (const [trackId, { input }] of taps) {
    input.gain.setTargetAtTime(getGain(trackId), input.context.currentTime, GAIN_SMOOTHING);
  }
}

/** Takes away every track's tap, when a play stops. */
export function clearTrackTaps(): void {
  for (const { input } of taps.values()) input.disconnect();
  taps = new Map();
}

/**
 * Returns a track's peak of the latest samples played, the louder of its two channels.
 *
 * @param trackId - The id of the track.
 * @returns The peak amplitude, 0 to 1 (more when it clips); null when the track plays nothing.
 */
export function readTrackPeak(trackId: string): number | null {
  const tap = taps.get(trackId);
  if (!tap) return null;
  let peak = 0;
  for (const analyser of tap.analysers) {
    analyser.getFloatTimeDomainData(samples);
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}

function makeTap(context: AudioContext, trackId: string, output: AudioNode): TrackTap {
  const input = context.createGain();
  input.gain.value = getGain(trackId);
  input.connect(output);
  const splitter = context.createChannelSplitter(2);
  input.connect(splitter);
  const analysers = [0, 1].map((channel) => {
    const analyser = context.createAnalyser();
    analyser.fftSize = SAMPLE_COUNT;
    splitter.connect(analyser, channel);
    return analyser;
  });
  return { input, analysers };
}

function getGain(trackId: string): number {
  if (unheardTrackIds.has(trackId)) return 0;
  return getVolumeGain(trackVolumes[trackId] ?? 0, TRACK_LOUDEST_DB);
}
