// The loop, as a row under the ruler while looping is on: the loop's bars as a band with an edge at
// each end. Its edges are dragged to move them, the band to move the loop, and a drag over empty
// space draws a new loop; the corner goes back to the whole song, or takes the loop's bars out of
// the song (✂, an edit like any other).
import { Scissors } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { LoopRange } from './loop-range.ts';
import { LOOP_MODE_ATTRIBUTE, useLoopDrag } from './use-loop-drag.ts';
import './LoopLane.css';

type LoopLaneProps = {
  range: LoopRange;
  isWhole: boolean;
  pixelsPerBar: number;
  bars: number;
  onChange: (range: LoopRange) => void;
  onWhole: () => void;
  onTakeOut: () => void;
};

/**
 * Shows the loop's row.
 *
 * @param props - The component's props.
 * @param props.range - The loop's bars.
 * @param props.isWhole - Whether the loop is the whole song.
 * @param props.pixelsPerBar - How wide a bar is drawn.
 * @param props.bars - How many bars the timeline shows.
 * @param props.onChange - Called with the loop's bars when a drag is let go.
 * @param props.onWhole - Called to loop the whole song again.
 * @param props.onTakeOut - Called to take the loop's bars out of the song.
 * @returns The row's element.
 */
export function LoopLane({
  range,
  isWhole,
  pixelsPerBar,
  bars,
  onChange,
  onWhole,
  onTakeOut,
}: LoopLaneProps) {
  const { shown, handlers } = useLoopDrag({ range, pixelsPerBar, bars, onChange });
  const style: CSSProperties = {
    left: shown.startBar * pixelsPerBar,
    width: (shown.endBar - shown.startBar) * pixelsPerBar,
  };
  const bandTip = `loop: bars ${shown.startBar + 1}–${shown.endBar}; drag to move it, its edges to change it`;
  return (
    <div className="timeline-row loop-lane">
      <div className="timeline-corner loop-lane-corner">
        <span className="loop-lane-label">loop</span>
        <button
          type="button"
          className="loop-lane-cut"
          onClick={onTakeOut}
          disabled={isWhole}
          data-tooltip={
            isWhole
              ? 'draw a loop to take its bars out of the song'
              : `take bars ${range.startBar + 1}–${range.endBar} out of the song, closing the gap`
          }
          aria-label="take the loop's bars out of the song"
        >
          <Scissors />
        </button>
        <button
          type="button"
          className="loop-lane-whole"
          onClick={onWhole}
          disabled={isWhole}
          data-tooltip={isWhole ? 'looping the whole song' : 'loop the whole song again'}
        >
          whole song
        </button>
      </div>
      <div
        className="timeline-lane loop-lane-lane"
        {...handlers}
        data-tooltip="drag over empty space to draw a loop"
      >
        <span
          className="loop-lane-band"
          style={style}
          {...{ [LOOP_MODE_ATTRIBUTE]: 'move' }}
          data-tooltip={bandTip}
        >
          <span className="loop-lane-edge is-start" {...{ [LOOP_MODE_ATTRIBUTE]: 'start' }} />
          <span className="loop-lane-edge is-end" {...{ [LOOP_MODE_ATTRIBUTE]: 'end' }} />
        </span>
      </div>
    </div>
  );
}
