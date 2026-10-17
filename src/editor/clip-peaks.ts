/**
 * A clip's waveform as peaks: the loudest sample of every short stretch, for the timeline to draw.
 * Given the samples, gives numbers; knows nothing of audio files or the page.
 */

/** Peaks to a second of audio. */
export const PEAKS_PER_SECOND = 200;

/** The loudest sample, 0 to 1, of every 1/PEAKS_PER_SECOND s across the channels. */
export function getPeaks(channels: Float32Array[], sampleRate: number): number[] {
  const length = channels[0]?.length ?? 0;
  const step = Math.max(1, Math.round(sampleRate / PEAKS_PER_SECOND));
  const peaks: number[] = [];
  for (let from = 0; from < length; from += step) {
    let peak = 0;
    for (const samples of channels) {
      for (let i = from; i < Math.min(from + step, length); i++) {
        peak = Math.max(peak, Math.abs(samples[i] ?? 0));
      }
    }
    peaks.push(Math.min(1, peak));
  }
  return peaks;
}
