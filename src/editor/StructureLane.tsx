// The structure a song was asked for, as a thin row of tiles above its first track: each section
// where its bars fall from the song's start, coloured by its letter. It is the structure as it was
// sent with the prompt; it does not follow the blocks, and nothing is done with it.
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Section } from '../../shared/structure.types.ts';
import { getStructureSpans } from './structure-lane.ts';
import { getTrackColor } from './timeline.ts';
import './StructureLane.css';

type StructureLaneProps = {
  sections: Section[];
  pixelsPerBar: number;
  onPanStart: (event: ReactPointerEvent) => void;
};

/**
 * Shows the structure a song was asked for above its tracks.
 *
 * @param props - The component's props.
 * @param props.sections - The structure's sections, in order.
 * @param props.pixelsPerBar - How wide a bar is drawn.
 * @param props.onPanStart - Called on a press on the row, which may drag the timeline sideways.
 * @returns The row's element.
 */
export function StructureLane({ sections, pixelsPerBar, onPanStart }: StructureLaneProps) {
  return (
    <div className="timeline-row structure-lane">
      <div
        className="timeline-corner structure-lane-label"
        data-tooltip="the structure the song was asked for when it was made; it does not follow edits"
      >
        structure
      </div>
      <div className="timeline-lane" onPointerDown={onPanStart}>
        {getStructureSpans(sections).map((span, i) => {
          const style: CSSProperties & Record<'--tile-color', string> = {
            '--tile-color': getTrackColor(span.letterIndex),
            left: span.startBar * pixelsPerBar,
            width: span.bars * pixelsPerBar,
          };
          return (
            <span
              key={i}
              className={`structure-lane-tile is-${span.relation}`}
              style={style}
              data-tooltip={span.description}
            >
              <span className="structure-lane-name">{span.name}</span>
              {span.role && <span className="structure-lane-role">{span.role}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
