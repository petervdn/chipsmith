// The song's timeline: a ruler of bars, a row per track with its blocks drawn as the slice of their
// clip's waveform they play (repeats after them, fainter), and the playhead. A tap on the ruler moves
// the play position there; a tap on a block selects it.
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.types.ts';
import { getClipLabel } from '../clips/ClipsPage.tsx';
import type { BlockSpan } from './timeline.ts';
import { getBarLabelStep, getBlockSpans, getTicksPerBar, getTimelineBars } from './timeline.ts';
import { usePlayheadLine } from './use-playhead-line.ts';
import { Waveform } from './Waveform.tsx';
import './Timeline.css';

/** A block by where it is: its track and its place in the track's blocks. */
export type BlockPlace = { trackId: string; index: number };

type TimelineProps = {
  song: Song;
  clips: Clip[];
  pixelsPerBar: number;
  selected: BlockPlace | null;
  cursor: number;
  onSelect: (place: BlockPlace | null) => void;
  onMoveTo: (seconds: number) => void;
};

/**
 * Shows the song's timeline: a ruler of bars, a row per track with its blocks, and the playhead. A
 * tap on the ruler moves the play position there; a tap on a block selects it, and a tap beside the
 * blocks selects none.
 *
 * @param props - The component's props.
 * @param props.song - The song.
 * @param props.clips - The clips the song's blocks play.
 * @param props.pixelsPerBar - How wide a bar is drawn, in pixels.
 * @param props.selected - The selected block, or null.
 * @param props.cursor - The cursor, in seconds.
 * @param props.onSelect - Called with the block tapped, or null when none is.
 * @param props.onMoveTo - Called with the second tapped on the ruler.
 * @returns The timeline element.
 */
export function Timeline({
  song,
  clips,
  pixelsPerBar,
  selected,
  cursor,
  onSelect,
  onMoveTo,
}: TimelineProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const ticksPerBar = getTicksPerBar(song);
  const pixelsPerTick = pixelsPerBar / ticksPerBar;
  const pixelsPerSecond = pixelsPerTick * getTicksPerSecond(song.bpm);
  usePlayheadLine(lineRef, { songId: song.id, cursor, pixelsPerSecond });
  const spans = getBlockSpans(song, clips);
  const bars = getTimelineBars(spans, ticksPerBar);
  const labelStep = getBarLabelStep(pixelsPerBar);
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  const style: CSSProperties & Record<'--bar-width' | '--lane-width', string> = {
    '--bar-width': `${pixelsPerBar}px`,
    '--lane-width': `${bars * pixelsPerBar}px`,
  };
  return (
    <div className="timeline" style={style}>
      <div className="timeline-row timeline-ruler-row">
        <div className="timeline-corner" />
        <div
          className="timeline-ruler"
          onClick={(event) => {
            const left = event.currentTarget.getBoundingClientRect().left;
            onMoveTo(Math.max(0, (event.clientX - left) / pixelsPerSecond));
          }}
          title="play from here"
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
      {song.tracks.map((track) => (
        <div key={track.id} className="timeline-row">
          <div className="timeline-track-name">{track.name}</div>
          <div className="timeline-lane" onClick={() => onSelect(null)}>
            {spans
              .filter((span) => span.trackId === track.id)
              .map((span) => (
                <TimelineBlock
                  key={span.index}
                  span={span}
                  clip={clipsById.get(span.clipId)}
                  pixelsPerTick={pixelsPerTick}
                  isSelected={selected?.trackId === track.id && selected.index === span.index}
                  onSelect={() => onSelect({ trackId: track.id, index: span.index })}
                />
              ))}
          </div>
        </div>
      ))}
      <div className="timeline-playhead">
        <div ref={lineRef} className="timeline-playhead-line" />
      </div>
    </div>
  );
}

type TimelineBlockProps = {
  span: BlockSpan;
  clip: Clip | undefined;
  pixelsPerTick: number;
  isSelected: boolean;
  onSelect: () => void;
};

/**
 * Shows a block and its repeats, each drawn as the slice of its clip's waveform it plays, the repeats
 * fainter.
 *
 * @param props - The component's props.
 * @param props.span - The block, as the timeline draws it.
 * @param props.clip - The block's clip, or undefined when it is missing.
 * @param props.pixelsPerTick - How wide a tick is drawn, in pixels.
 * @param props.isSelected - Whether the block is selected.
 * @param props.onSelect - Called when the block or one of its repeats is tapped.
 * @returns The block's elements, one for each play.
 */
function TimelineBlock({ span, clip, pixelsPerTick, isSelected, onSelect }: TimelineBlockProps) {
  const width = span.length * pixelsPerTick;
  const label = clip ? getClipLabel(clip) : `missing ${span.clipId}`;
  return (
    <>
      {Array.from({ length: span.repeats }, (_unused, repeat) => (
        <button
          key={repeat}
          type="button"
          className={`timeline-block${repeat > 0 ? ' is-repeat' : ''}${isSelected ? ' is-selected' : ''}${clip ? '' : ' is-missing'}`}
          style={{ left: (span.start + repeat * span.length) * pixelsPerTick, width }}
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          title={`${label} · ${span.clipId}${span.repeats > 1 ? ` · ×${span.repeats}` : ''}`}
        >
          {span.slice && (
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
        </button>
      ))}
    </>
  );
}
