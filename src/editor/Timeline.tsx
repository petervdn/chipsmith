// The song's timeline: a ruler of bars, a row per track with its blocks, and the playhead. A tap on
// the ruler moves the play position there; a tap on a track's name or a block selects it; blocks
// are dragged to move and trim them.
import { useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.types.ts';
import type { DragMode } from './block-drag.ts';
import type { BlockPlace } from './song-edits.ts';
import {
  getBarLabelStep,
  getBlockSpans,
  getTicksPerBar,
  getTimelineBars,
  getTrackColor,
} from './timeline.ts';
import { TimelineBlock } from './TimelineBlock.tsx';
import type { TrackMix } from './track-mix.ts';
import { isHeard } from './track-mix.ts';
import type { Selection } from './use-song-draft.ts';
import { usePlayheadLine } from './use-playhead-line.ts';
import './Timeline.css';

/** How tall a track's row is drawn, in pixels; Timeline.css draws it so. */
export const ROW_HEIGHT = 52;

type TimelineProps = {
  song: Song;
  clips: Clip[];
  pixelsPerBar: number;
  selection: Selection;
  mix: TrackMix;
  cursor: number;
  onSelect: (selection: Selection) => void;
  onMoveTo: (seconds: number) => void;
  onPress: (event: ReactPointerEvent, place: BlockPlace, mode: DragMode) => void;
  wasDragged: () => boolean;
  waitingClipIds: string[];
};

/**
 * Shows the timeline of a song.
 *
 * @param props - The component's props.
 * @param props.song - The song, with the tracks to draw (the draft, or a drag's preview).
 * @param props.clips - The clips its blocks play.
 * @param props.pixelsPerBar - How wide a bar is drawn.
 * @param props.selection - The block or track selected, or null.
 * @param props.mix - The tracks muted and soloed; a track not heard is drawn faint.
 * @param props.cursor - Where play starts, in seconds, shown by the playhead while stopped.
 * @param props.onSelect - Called with what a tap selects, or null for a tap on empty space.
 * @param props.onMoveTo - Called with the second a tap on the ruler points at.
 * @param props.onPress - Called on a press on a block or one of its edges.
 * @param props.wasDragged - Tells whether a drag just ended, so its click selects nothing.
 * @param props.waitingClipIds - The clips whose audio is still being rendered.
 * @returns The timeline element.
 */
export function Timeline({
  song,
  clips,
  pixelsPerBar,
  selection,
  mix,
  cursor,
  onSelect,
  onMoveTo,
  onPress,
  wasDragged,
  waitingClipIds,
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
  const style: CSSProperties & Record<'--bar-width' | '--lane-width' | '--row-height', string> = {
    '--bar-width': `${pixelsPerBar}px`,
    '--lane-width': `${bars * pixelsPerBar}px`,
    '--row-height': `${ROW_HEIGHT}px`,
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
      {song.tracks.map((track, trackIndex) => {
        const isTrackSelected = selection?.kind === 'track' && selection.trackId === track.id;
        const marks = [
          mix.muted.includes(track.id) ? 'muted' : '',
          mix.soloed.includes(track.id) ? 'solo' : '',
        ].filter(Boolean);
        const rowStyle: CSSProperties & Record<'--track-color', string> = {
          '--track-color': getTrackColor(trackIndex),
        };
        return (
          <div
            key={track.id}
            className={`timeline-row${isHeard(track.id, mix) ? '' : ' is-unheard'}`}
            style={rowStyle}
          >
            <button
              type="button"
              className={`timeline-track-name${isTrackSelected ? ' is-selected' : ''}`}
              onClick={() => onSelect({ kind: 'track', trackId: track.id })}
              title="the track: rename, mute, solo, remove"
            >
              <span className="timeline-track-title">{track.name}</span>
              {marks.length > 0 && <span className="timeline-track-mix">{marks.join(' · ')}</span>}
            </button>
            <div className="timeline-lane" onClick={() => onSelect(null)}>
              {spans
                .filter((span) => span.trackId === track.id)
                .map((span) => {
                  const place = { trackId: track.id, index: span.index };
                  return (
                    <TimelineBlock
                      key={span.index}
                      span={span}
                      clip={clipsById.get(span.clipId)}
                      pixelsPerTick={pixelsPerTick}
                      isRendering={waitingClipIds.includes(span.clipId)}
                      isSelected={
                        selection?.kind === 'block' &&
                        selection.place.trackId === track.id &&
                        selection.place.index === span.index
                      }
                      onPress={(event, mode) => onPress(event, place, mode)}
                      onSelect={() => {
                        if (!wasDragged()) onSelect({ kind: 'block', place });
                      }}
                    />
                  );
                })}
            </div>
          </div>
        );
      })}
      <div className="timeline-playhead">
        <div ref={lineRef} className="timeline-playhead-line" />
      </div>
    </div>
  );
}
