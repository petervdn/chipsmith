/**
 * Listening to each track of what plays, for its level meter: every track's sources go through a tap
 * of its own on their way to the output, before the mute switch, and its peak can be read at any
 * moment. Knows nothing of what is shown.
 */

/** Samples read at a time: about 21 ms at 48 kHz, longer than a frame, so no peak falls between. */
const SAMPLE_COUNT = 1024;

/** A track's tap: what its sources play into, and its two channels' analysers. */
type TrackTap = { input: GainNode; analysers: AnalyserNode[] };

let taps = new Map<string, TrackTap>();
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
  const tap = taps.get(trackId) ?? makeTap(context, output);
  taps.set(trackId, tap);
  return tap.input;
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

function makeTap(context: AudioContext, output: AudioNode): TrackTap {
  const input = context.createGain();
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
