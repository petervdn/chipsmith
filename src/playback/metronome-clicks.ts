/**
 * Where the metronome clicks: on every beat of the song, the first beat of each bar marked, worked
 * out from its tempo. Knows nothing of the page or of audio.
 */

/** A song's tempo, as the metronome clicks it. */
export type MetronomeTempo = { bpm: number; beatsPerBar: number };

/** A click: the second of the song it falls on, and whether it is the first beat of a bar. */
export type Click = { second: number; isDownbeat: boolean };

/** The seconds in a minute. */
const MINUTE = 60;

/**
 * Returns the clicks in a stretch of the song: one on every beat, the first beat of each bar marked.
 *
 * @param from - The stretch's start, in seconds of the song; a beat on it is in.
 * @param to - The stretch's end; a beat on it is not.
 * @param tempo - The song's tempo.
 * @param tempo.bpm - Its beats a minute.
 * @param tempo.beatsPerBar - Its beats in a bar.
 * @returns The clicks, in order.
 */
export function getClicks(from: number, to: number, { bpm, beatsPerBar }: MetronomeTempo): Click[] {
  if (bpm <= 0 || to <= from) return [];
  const beatSeconds = MINUTE / bpm;
  const clicks: Click[] = [];
  for (let beat = Math.ceil(from / beatSeconds); beat * beatSeconds < to; beat += 1) {
    clicks.push({ second: beat * beatSeconds, isDownbeat: beat % Math.max(1, beatsPerBar) === 0 });
  }
  return clicks;
}
