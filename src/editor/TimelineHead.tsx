// The head of the song's timeline, drawn apart from its tracks so it can stay in view at the top
// while the page scrolls: the ruler of bars (a tap or drag moves the play position), the loop (while
// looping), the structure the song was asked for (when shown), and the playhead over them. Its
// corner adds a track, and its right edge drags the track names wider, as theirs does.
import { Plus } from 'lucide-react';
import { useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.schema.ts';
import type { Section } from '../../shared/structure.schema.ts';
import { LoopLane } from './LoopLane.tsx';
import type { LoopRange } from './loop-range.ts';
import { StructureLane } from './StructureLane.tsx';
import type { TimelineSizes } from './timeline.ts';
import {
  getBarLabelStep,
  getBlockSpans,
  getTicksPerBar,
  getTimelineBars,
  getTimelineSizes,
} from './timeline.ts';
import type { ResizeHandlers } from './use-track-name-resize.ts';
import { usePlayheadLine } from './use-playhead-line.ts';
import './Timeline.css';

/** The loop as the timeline's head draws and changes it. */
export type TimelineLoop = {
  range: LoopRange;
  isWhole: boolean;
  onChange: (range: LoopRange) => void;
  onWhole: () => void;
};

type TimelineHeadProps = {
  song: Song;
  structure: Section[] | null;
  loop: TimelineLoop | null;
  clips: Clip[];
  pixelsPerBar: number;
  trackNameWidth: number;
  resizeHandlers: ResizeHandlers;
  cursor: number;
  scrub: number | null;
  onScrub: (seconds: number | null) => void;
  onMoveTo: (seconds: number) => void;
  onAddTrack: () => void;
};

/**
 * Shows the head of a song's timeline: the ruler, the loop and the structure.
 *
 * @param props - The component's props.
 * @param props.song - The song, with the tracks drawn under it (the draft, or a drag's preview).
 * @param props.structure - The sections of the structure the song was asked for, or null to draw
 *   none.
 * @param props.loop - The loop, drawn in a row under the ruler, or null while not looping.
 * @param props.clips - The clips its blocks play, for how many bars there are.
 * @param props.pixelsPerBar - How wide a bar is drawn.
 * @param props.trackNameWidth - How wide the track names are drawn, in pixels.
 * @param props.resizeHandlers - The pointer handlers for the track names' right edge.
 * @param props.cursor - Where play starts, in seconds, shown by the playhead while stopped.
 * @param props.scrub - Where the play position goes while the ruler is dragged, or null.
 * @param props.onScrub - Called with where a drag on the ruler points, or null when it ends.
 * @param props.onMoveTo - Called with the second a tap or drag on the ruler ends at.
 * @param props.onAddTrack - Called to add an empty track at the bottom.
 * @returns The head's element.
 */
export function TimelineHead({
  song,
  structure,
  loop,
  clips,
  pixelsPerBar,
  trackNameWidth,
  resizeHandlers,
  cursor,
  scrub,
  onScrub,
  onMoveTo,
  onAddTrack,
}: TimelineHeadProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const ticksPerBar = getTicksPerBar(song);
  const pixelsPerSecond = (pixelsPerBar / ticksPerBar) * getTicksPerSecond(song.bpm);
  usePlayheadLine(lineRef, { songId: song.id, cursor, pixelsPerSecond });
  const bars = getTimelineBars(getBlockSpans(song, clips), ticksPerBar);
  const labelStep = getBarLabelStep(pixelsPerBar);
  const style: CSSProperties & TimelineSizes = getTimelineSizes({
    pixelsPerBar,
    bars,
    trackNameWidth,
  });
  return (
    <div className="timeline timeline-head" style={style}>
      <div className="timeline-row timeline-ruler-row">
        <div className="timeline-corner">
          <button
            type="button"
            className="timeline-add-track"
            onClick={onAddTrack}
            data-tooltip="add a track"
            aria-label="add a track"
          >
            <Plus />
          </button>
          <span
            className="timeline-name-edge"
            {...resizeHandlers}
            data-tooltip="drag to make the track names wider or narrower"
          />
        </div>
        <div
          className="timeline-ruler"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            onScrub(getRulerSeconds(event, pixelsPerSecond));
          }}
          onPointerMove={(event) => {
            if (scrub !== null) onScrub(getRulerSeconds(event, pixelsPerSecond));
          }}
          onPointerUp={(event) => {
            if (scrub === null) return;
            onMoveTo(getRulerSeconds(event, pixelsPerSecond));
            onScrub(null);
          }}
          onPointerCancel={() => onScrub(null)}
          data-tooltip="tap or drag to move the play position"
        >
          {Array.from({ length: bars }, (_unused, bar) =>
            bar % labelStep === 0 ? (
              <span key={bar} className="timeline-bar-number" style={{ left: bar * pixelsPerBar }}>
                {bar + 1}
              </span>
            ) : null,
          )}
        </div>
      </div>
      {loop && (
        <LoopLane
          range={loop.range}
          isWhole={loop.isWhole}
          pixelsPerBar={pixelsPerBar}
          bars={bars}
          onChange={loop.onChange}
          onWhole={loop.onWhole}
        />
      )}
      {structure && <StructureLane sections={structure} pixelsPerBar={pixelsPerBar} />}
      <div className="timeline-playhead">
        <div ref={lineRef} className="timeline-playhead-line" />
        {scrub !== null && (
          <div
            className="timeline-playhead-line is-scrub"
            style={{ transform: `translateX(${scrub * pixelsPerSecond}px)` }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Returns the second of the song a pointer on the ruler points at.
 *
 * @param event - The pointer event on the ruler.
 * @param pixelsPerSecond - How wide a second is drawn.
 * @returns The second, never before the start.
 */
function getRulerSeconds(event: ReactPointerEvent<HTMLElement>, pixelsPerSecond: number): number {
  const left = event.currentTarget.getBoundingClientRect().left;
  return Math.max(0, (event.clientX - left) / pixelsPerSecond);
}
