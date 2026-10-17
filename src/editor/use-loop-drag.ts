// Dragging in the loop row: an edge of the loop moves it, the loop itself moves whole, and a drag
// over empty space draws a new one. The loop follows the pointer in the row while dragged and is set when it
// is let go, so playing round it starts again only once.
import { useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { LoopDragMode, LoopRange } from './loop-range.ts';
import { getDraggedRange } from './loop-range.ts';

/** The attribute on the loop's parts saying what a press on them drags. */
export const LOOP_MODE_ATTRIBUTE = 'data-loop-mode';

/** A drag under way: what it does, the loop it started from and the bar line it started at. */
type LoopDrag = { mode: LoopDragMode; range: LoopRange; pressBar: number; shown: LoopRange };

/**
 * Drags the loop in its row.
 *
 * @param row - What the drag needs.
 * @param row.range - The loop now.
 * @param row.pixelsPerBar - How wide a bar is drawn.
 * @param row.bars - How many bars the timeline shows.
 * @param row.onChange - Called with the loop when a drag is let go.
 * @returns `shown`, the loop to draw (the dragged one while dragging), and the pointer handlers for
 *   the row's lane.
 */
export function useLoopDrag({
  range,
  pixelsPerBar,
  bars,
  onChange,
}: {
  range: LoopRange;
  pixelsPerBar: number;
  bars: number;
  onChange: (range: LoopRange) => void;
}) {
  const [drag, setDrag] = useState<LoopDrag | null>(null);
  function getBar(event: ReactPointerEvent<HTMLElement>): number {
    const left = event.currentTarget.getBoundingClientRect().left;
    return Math.round((event.clientX - left) / pixelsPerBar);
  }
  function getMode(event: ReactPointerEvent): LoopDragMode {
    const part =
      event.target instanceof Element ? event.target.closest(`[${LOOP_MODE_ATTRIBUTE}]`) : null;
    const mode = part?.getAttribute(LOOP_MODE_ATTRIBUTE);
    return mode === 'start' || mode === 'end' || mode === 'move' ? mode : 'draw';
  }
  function getShown(event: ReactPointerEvent<HTMLElement>, started: LoopDrag): LoopRange {
    const bar = getBar(event);
    // a tap on empty space draws nothing: a new loop is drawn only once the pointer moves a bar
    if (started.mode === 'draw' && bar === started.pressBar) return started.range;
    return getDraggedRange({ ...started, bar, bars });
  }
  return {
    shown: drag?.shown ?? range,
    handlers: {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const started = { mode: getMode(event), range, pressBar: getBar(event), shown: range };
        setDrag({ ...started, shown: getShown(event, started) });
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        if (drag) setDrag({ ...drag, shown: getShown(event, drag) });
      },
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
        if (!drag) return;
        onChange(getShown(event, drag));
        setDrag(null);
      },
      onPointerCancel: () => setDrag(null),
    },
  };
}
