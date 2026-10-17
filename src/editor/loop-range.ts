/**
 * The editor's loop in whole bars: the whole song to start with, and where a drag in the loop row
 * puts it (an edge moved, the loop moved, or a new one drawn). Given bars, gives bars and seconds;
 * knows nothing of the page or the audio.
 */
import type { Loop } from '../playback/loop.ts';

/** A loop in bars: its first bar and the bar it ends before, from 0. */
export type LoopRange = { startBar: number; endBar: number };

/** What a drag in the loop row does: move an edge, move the loop, or draw a new one. */
export type LoopDragMode = 'start' | 'end' | 'move' | 'draw';

/**
 * Returns the loop of a whole song: from its start to the bar line nearest its end, so a song
 * whose audio rings a little past its last bar loops on the bar.
 *
 * @param songEnd - Where the song's last block ends, in ticks.
 * @param ticksPerBar - Ticks to a bar of the song.
 * @returns The loop, at least a bar long.
 */
export function getWholeSongRange(songEnd: number, ticksPerBar: number): LoopRange {
  return { startBar: 0, endBar: Math.max(1, Math.round(songEnd / ticksPerBar)) };
}

/**
 * Returns where a drag in the loop row puts the loop.
 *
 * @param drag - The drag.
 * @param drag.mode - What the drag does.
 * @param drag.range - The loop when the drag started.
 * @param drag.pressBar - The bar line nearest where the drag started.
 * @param drag.bar - The bar line nearest where the pointer is now.
 * @param drag.bars - How many bars the timeline shows, which the loop stays within.
 * @returns The loop, at least a bar long and within the timeline.
 */
export function getDraggedRange({
  mode,
  range,
  pressBar,
  bar,
  bars,
}: {
  mode: LoopDragMode;
  range: LoopRange;
  pressBar: number;
  bar: number;
  bars: number;
}): LoopRange {
  const at = Math.min(bars, Math.max(0, bar));
  if (mode === 'start') {
    return { startBar: Math.min(at, range.endBar - 1), endBar: range.endBar };
  }
  if (mode === 'end') {
    return { startBar: range.startBar, endBar: Math.max(at, range.startBar + 1) };
  }
  if (mode === 'move') {
    const length = range.endBar - range.startBar;
    const startBar = Math.min(bars - length, Math.max(0, range.startBar + bar - pressBar));
    return { startBar, endBar: startBar + length };
  }
  const startBar = Math.min(pressBar, at);
  const endBar = Math.max(pressBar, at);
  if (endBar > startBar) return { startBar, endBar };
  return startBar < bars
    ? { startBar, endBar: startBar + 1 }
    : { startBar: bars - 1, endBar: bars };
}

/**
 * Returns a loop in bars as the player plays it, in seconds.
 *
 * @param range - The loop in bars.
 * @param range.startBar - Its first bar.
 * @param range.endBar - The bar it ends before.
 * @param secondsPerBar - How long a bar of the song lasts.
 * @returns The loop's start and end, in seconds.
 */
export function getLoopSeconds({ startBar, endBar }: LoopRange, secondsPerBar: number): Loop {
  return { start: startBar * secondsPerBar, end: endBar * secondsPerBar };
}
