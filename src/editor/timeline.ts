/**
 * Where a song's blocks lie on the timeline, in ticks: each block's start, the length of one play
 * and its repeats; the bars of the song; which bars the ruler numbers at a zoom. Given a song and
 * its clips, gives numbers; knows nothing of the page.
 */
import type { Clip } from '../../shared/clip.types.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.types.ts';
import { TICKS_PER_BEAT } from '../../shared/song.types.ts';

/** A block as the timeline draws it; `index` is its place in its track's blocks. */
export type BlockSpan = {
  trackId: string;
  index: number;
  clipId: string;
  /** Where it starts, in ticks. */
  start: number;
  /** One play's length, in ticks. */
  length: number;
  repeats: number;
  /** Where its last repeat ends, in ticks. */
  end: number;
  /** Where in its clip it starts and how long it plays, in seconds; null when its clip is unknown. */
  slice: { offset: number; duration: number } | null;
};

/** Bars the timeline shows past the song's end, to place things after it. */
const BARS_AFTER_END = 4;
/** The fewest bars the timeline shows. */
const LEAST_BARS = 8;

/**
 * Returns how long a clip is in ticks at a song's tempo.
 *
 * @param clips - The clips the song plays.
 * @param clipId - The clip.
 * @param bpm - The song's tempo.
 * @returns Its length in ticks; a beat when the clip is not known.
 */
export function getClipTicks(clips: Clip[], clipId: string, bpm: number): number {
  const clip = clips.find((candidate) => candidate.id === clipId);
  return clip ? Math.round(clip.seconds * getTicksPerSecond(bpm)) : TICKS_PER_BEAT;
}

/**
 * Returns the ticks to a bar of a song.
 *
 * @param song - The song.
 * @param song.beats - Beats to a bar.
 * @returns Ticks to a bar.
 */
export function getTicksPerBar({ beats }: Song): number {
  return beats * TICKS_PER_BEAT;
}

/**
 * Returns every block of a song as the timeline draws it, track by track. A block whose clip is
 * unknown is drawn a beat long.
 *
 * @param song - The song.
 * @param clips - The clips the song's blocks play.
 * @returns The blocks' spans, track by track, each track's in the order of its blocks.
 */
export function getBlockSpans(song: Song, clips: Clip[]): BlockSpan[] {
  const ticksPerSecond = getTicksPerSecond(song.bpm);
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  return song.tracks.flatMap((track) =>
    track.blocks.map((block, index) => {
      const clip = clipsById.get(block.clip);
      const clipTicks = clip ? Math.round(clip.seconds * ticksPerSecond) : TICKS_PER_BEAT;
      const length = block.trim ? block.trim.length : clipTicks;
      const offset = block.trim ? block.trim.offset : 0;
      return {
        trackId: track.id,
        index,
        clipId: block.clip,
        start: block.start,
        length,
        repeats: block.repeats,
        end: block.start + length * block.repeats,
        slice: clip ? { offset: offset / ticksPerSecond, duration: length / ticksPerSecond } : null,
      };
    }),
  );
}

/**
 * Returns how many bars the timeline shows: the song's, and some after it to place things.
 *
 * @param spans - The song's blocks as the timeline draws them.
 * @param ticksPerBar - Ticks to a bar of the song.
 * @returns The number of bars, never fewer than LEAST_BARS.
 */
export function getTimelineBars(spans: BlockSpan[], ticksPerBar: number): number {
  const end = spans.reduce((last, span) => Math.max(last, span.end), 0);
  return Math.max(LEAST_BARS, Math.ceil(end / ticksPerBar) + BARS_AFTER_END);
}

/**
 * Returns every how many bars the ruler shows a number, so the numbers do not run into each other.
 *
 * @param pixelsPerBar - How wide a bar is drawn, in pixels.
 * @returns 1, 4 or 8: the narrower the bars, the more of them between numbers.
 */
export function getBarLabelStep(pixelsPerBar: number): number {
  if (pixelsPerBar >= 22) return 1;
  if (pixelsPerBar >= 10) return 4;
  return 8;
}
