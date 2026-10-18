// The editor's loop: off to start with, the whole song until a loop is drawn, and back to the whole
// song on asking. Not saved: it is how the song is listened to while editing.
import { useState } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.schema.ts';
import type { Loop } from '../playback/loop.ts';
import type { LoopRange } from './loop-range.ts';
import { getLoopSeconds, getWholeSongRange } from './loop-range.ts';
import { getBlockSpans, getTicksPerBar } from './timeline.ts';

/**
 * Keeps the editor's loop: whether it is on, and its bars.
 *
 * @param song - The song as edited.
 * @param clips - The clips its blocks play.
 * @returns `isOn` and `toggle`; `range`, the loop's bars (the whole song's until one is drawn), and
 *   `isWhole`; `setRange`, which sets the bars, and `setWhole`, which goes back to the whole song;
 *   `loopRange`, which sets the bars and turns the loop on; `loop`, the loop in seconds for the
 *   player, or null while it is off.
 */
export function useLoop(song: Song, clips: Clip[]) {
  const [isOn, setOn] = useState(false);
  const [drawn, setDrawn] = useState<LoopRange | null>(null);
  const ticksPerBar = getTicksPerBar(song);
  const songEnd = getBlockSpans(song, clips).reduce((last, span) => Math.max(last, span.end), 0);
  const range = drawn ?? getWholeSongRange(songEnd, ticksPerBar);
  const secondsPerBar = ticksPerBar / getTicksPerSecond(song.bpm);
  const loop: Loop | null = isOn ? getLoopSeconds(range, secondsPerBar) : null;
  return {
    isOn,
    toggle: () => setOn(!isOn),
    range,
    isWhole: drawn === null,
    setRange: setDrawn,
    setWhole: () => setDrawn(null),
    loopRange: (looped: LoopRange) => {
      setDrawn(looped);
      setOn(true);
    },
    loop,
  };
}
