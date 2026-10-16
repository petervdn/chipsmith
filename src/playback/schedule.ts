/**
 * What a song plays when: every block and each of its repeats as a stretch of a clip's audio, in
 * seconds from the song's start. Given a song and its clips, gives the stretches; knows no audio.
 */
import type { Clip } from '../../shared/clip.types.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.types.ts';

/** A stretch of a clip's audio played at a time of the song. */
export type Stretch = {
  clipId: string;
  trackId: string;
  /** When it starts, in seconds from the song's start. */
  start: number;
  /** Where in the clip's audio it starts, in seconds. */
  offset: number;
  duration: number;
};

/** The stretches a song plays; a block whose clip is not known plays nothing. */
export function getStretches(song: Song, clips: Clip[]): Stretch[] {
  const secondsPerTick = 1 / getTicksPerSecond(song.bpm);
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  const stretches: Stretch[] = [];
  for (const track of song.tracks) {
    for (const { clip: clipId, start, trim, repeats } of track.blocks) {
      const clip = clipsById.get(clipId);
      if (!clip) continue;
      const offset = trim ? trim.offset * secondsPerTick : 0;
      const duration = trim ? trim.length * secondsPerTick : clip.seconds;
      for (let repeat = 0; repeat < repeats; repeat++) {
        stretches.push({
          clipId,
          trackId: track.id,
          start: start * secondsPerTick + repeat * duration,
          offset,
          duration,
        });
      }
    }
  }
  return stretches;
}

/** Where the last stretch ends, in seconds. */
export function getEnd(stretches: Stretch[]): number {
  return stretches.reduce((end, { start, duration }) => Math.max(end, start + duration), 0);
}
