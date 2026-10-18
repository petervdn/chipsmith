/**
 * What a song plays when: every block and each of its repeats as a stretch of a clip's audio, in
 * seconds from the song's start, and the pieces of them that sound between two seconds. Given a song
 * and its clips, gives the stretches; knows no audio.
 */
import type { Clip } from '../../shared/clip.schema.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.schema.ts';

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

/**
 * Returns the stretches a song plays: every block and each of its repeats. A block whose clip is not
 * known plays nothing.
 *
 * @param song - The song.
 * @param clips - The clips the song's blocks play.
 * @returns The stretches, track by track, in seconds from the song's start.
 */
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

/**
 * Returns where the last stretch ends.
 *
 * @param stretches - The stretches a song plays.
 * @returns The end, in seconds from the song's start; 0 when there are none.
 */
export function getEnd(stretches: Stretch[]): number {
  return stretches.reduce((end, { start, duration }) => Math.max(end, start + duration), 0);
}

/**
 * Returns the stretches cut to their clips' audio, as it was decoded: none plays past its audio's
 * end, and a stretch of a clip with no audio is left out.
 *
 * @param stretches - The stretches a song plays.
 * @param getAudioSeconds - Returns the length of a clip's decoded audio, or undefined when it has none.
 * @returns The stretches that play, each no longer than its clip's audio.
 */
export function getFittedStretches(
  stretches: Stretch[],
  getAudioSeconds: (clipId: string) => number | undefined,
): Stretch[] {
  return stretches.flatMap((stretch) => {
    const seconds = getAudioSeconds(stretch.clipId);
    if (seconds === undefined) return [];
    return [{ ...stretch, duration: Math.min(stretch.duration, seconds - stretch.offset) }];
  });
}

/** A piece of a stretch, placed: when it plays, from where in its clip's audio, for how long. */
export type Piece = {
  clipId: string;
  trackId: string;
  /** When it plays, in seconds on the play's own clock (the song's seconds, shifted). */
  at: number;
  offset: number;
  duration: number;
};

/**
 * Returns the parts of stretches that sound between two seconds of the song, each moved by a shift:
 * a stretch that starts before the first second is entered part way, one that ends after the last
 * is cut.
 *
 * @param stretches - The stretches, each no longer than its clip's audio.
 * @param from - The first second of the song played.
 * @param to - The second of the song at which playing stops.
 * @param shift - How far the pieces are moved, in seconds: 0 to play them where they are in the song.
 * @returns The pieces that sound, in the order of their stretches.
 */
export function getPieces(stretches: Stretch[], from: number, to: number, shift: number): Piece[] {
  return stretches.flatMap(({ clipId, trackId, start, offset, duration }) => {
    const pieceStart = Math.max(start, from);
    const pieceEnd = Math.min(start + duration, to);
    if (pieceEnd <= pieceStart) return [];
    return [
      {
        clipId,
        trackId,
        at: pieceStart + shift,
        offset: offset + pieceStart - start,
        duration: pieceEnd - pieceStart,
      },
    ];
  });
}
