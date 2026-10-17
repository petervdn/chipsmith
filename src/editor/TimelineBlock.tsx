// A block on the timeline and its repeats after it (fainter), each the slice of its clip's waveform
// it plays. Its body drags it, its edges trim it; a tap selects it.
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import { getClipLabel } from '../clips/ClipsPage.tsx';
import type { DragMode } from './block-drag.ts';
import type { BlockSpan } from './timeline.ts';
import { Waveform } from './Waveform.tsx';
import './TimelineBlock.css';

type TimelineBlockProps = {
  span: BlockSpan;
  clip: Clip | undefined;
  pixelsPerTick: number;
  isSelected: boolean;
  isRendering: boolean;
  onPress: (event: ReactPointerEvent, mode: DragMode) => void;
  onSelect: () => void;
};

/**
 * Shows a block and its repeats.
 *
 * @param props - The component's props.
 * @param props.span - Where the block lies and what of its clip it plays.
 * @param props.clip - The block's clip, or undefined when it is not known.
 * @param props.pixelsPerTick - How wide a tick is drawn.
 * @param props.isSelected - Whether the block is the one selected.
 * @param props.isRendering - Whether its clip's audio is still being rendered: no waveform yet.
 * @param props.onPress - Called on a press on the block (to move it) or an edge (to trim it).
 * @param props.onSelect - Called when the block is tapped.
 * @returns The block's buttons, one per repeat.
 */
export function TimelineBlock({
  span,
  clip,
  pixelsPerTick,
  isSelected,
  isRendering,
  onPress,
  onSelect,
}: TimelineBlockProps) {
  const width = span.length * pixelsPerTick;
  const label = clip ? getClipLabel(clip) : `missing ${span.clipId}`;
  const states = `${isSelected ? ' is-selected' : ''}${clip ? '' : ' is-missing'}${isRendering ? ' is-rendering' : ''}`;
  return (
    <>
      {Array.from({ length: span.repeats }, (_unused, repeat) => (
        <div
          key={repeat}
          role="button"
          tabIndex={repeat === 0 ? 0 : -1}
          className={`timeline-block${repeat > 0 ? ' is-repeat' : ''}${states}`}
          style={{ left: (span.start + repeat * span.length) * pixelsPerTick, width }}
          onPointerDown={(event) => onPress(event, 'move')}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          {span.slice && !isRendering && (
            <Waveform
              clipId={span.clipId}
              offset={span.slice.offset}
              duration={span.slice.duration}
              width={width}
            />
          )}
          <span className="timeline-block-label">
            {repeat === 0 ? label : repeat + 1}
            {repeat === 0 && span.repeats > 1 && ` ×${span.repeats}`}
          </span>
          {repeat === 0 && (
            <>
              <span
                className="timeline-block-edge is-start"
                onPointerDown={(event) => onPress(event, 'trim-start')}
              />
              <span
                className="timeline-block-edge is-end"
                onPointerDown={(event) => onPress(event, 'trim-end')}
              />
            </>
          )}
        </div>
      ))}
    </>
  );
}
