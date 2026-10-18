// The song's tracks on the timeline, under its head (TimelineHead.tsx): a row per track (its name,
// which selects it, mute and solo, and its level meter; the names' right edge drags them wider) with
// its blocks, and the playhead. A tap on a block selects it; blocks are
// dragged to move and trim them.
import { useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.schema.ts';
import type { DragMode } from './block-drag.ts';
import type { BlockPlace } from './song-edits.ts';
import type { TimelineSizes } from './timeline.ts';
import {
  getBlockSpans,
  getTicksPerBar,
  getTimelineBars,
  getTimelineSizes,
  getTrackColor,
} from './timeline.ts';
import { TimelineBlock } from './TimelineBlock.tsx';
import { TrackMeter } from './TrackMeter.tsx';
import { TrackMixButtons } from './TrackMixButtons.tsx';
import type { TrackMix } from './track-mix.ts';
import { isHeard } from './track-mix.ts';
import type { Selection } from './use-song-draft.ts';
import type { ResizeHandlers } from './use-track-name-resize.ts';
import { usePlayheadLine } from './use-playhead-line.ts';
import './Timeline.css';
import { LANE_TRACK_ATTRIBUTE } from './lane-position.ts';

type TimelineProps = {
  song: Song;
  clips: Clip[];
  pixelsPerBar: number;
  trackHeight: number;
  trackNameWidth: number;
  resizeHandlers: ResizeHandlers;
  selection: Selection;
  mix: TrackMix;
  cursor: number;
  scrub: number | null;
  onSelect: (selection: Selection) => void;
  onPress: (event: ReactPointerEvent, place: BlockPlace, mode: DragMode) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onPanStart: (event: ReactPointerEvent) => void;
  wasDragged: () => boolean;
  waitingClipIds: string[];
};

/**
 * Shows the tracks of a song on the timeline.
 *
 * @param props - The component's props.
 * @param props.song - The song, with the tracks to draw (the draft, or a drag's preview).
 * @param props.clips - The clips its blocks play.
 * @param props.pixelsPerBar - How wide a bar is drawn.
 * @param props.trackHeight - How tall a track's row is drawn, in pixels.
 * @param props.trackNameWidth - How wide the track names are drawn, in pixels.
 * @param props.resizeHandlers - The pointer handlers for the track names' right edge.
 * @param props.selection - The block or track selected, or null.
 * @param props.mix - The tracks muted and soloed; a track not heard is drawn faint.
 * @param props.cursor - Where play starts, in seconds, shown by the playhead while stopped.
 * @param props.scrub - Where the play position goes while the ruler is dragged, or null.
 * @param props.onSelect - Called with what a tap selects, or null for a tap on empty space.
 * @param props.onPress - Called on a press on a block or one of its edges.
 * @param props.onToggleMute - Called with a track's id to mute or unmute it.
 * @param props.onToggleSolo - Called with a track's id to solo it or stop soloing it.
 * @param props.onPanStart - Called on a press on a lane's empty space, which may drag the timeline
 *   sideways.
 * @param props.wasDragged - Tells whether a drag just ended, so its click selects nothing.
 * @param props.waitingClipIds - The clips whose audio is still being rendered.
 * @returns The tracks' element.
 */
export function Timeline({
  song,
  clips,
  pixelsPerBar,
  trackHeight,
  trackNameWidth,
  resizeHandlers,
  selection,
  mix,
  cursor,
  scrub,
  onSelect,
  onPress,
  onToggleMute,
  onToggleSolo,
  onPanStart,
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
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  const style: CSSProperties & TimelineSizes & Record<'--row-height', string> = {
    ...getTimelineSizes({ pixelsPerBar, bars, trackNameWidth }),
    '--row-height': `${trackHeight}px`,
  };
  const nameEdge = (
    <span
      className="timeline-name-edge"
      {...resizeHandlers}
      data-tooltip="drag to make the track names wider or narrower"
    />
  );
  return (
    <div className="timeline" style={style}>
      {song.tracks.map((track, trackIndex) => {
        const isTrackSelected = selection?.kind === 'track' && selection.trackId === track.id;
        const rowStyle: CSSProperties & Record<'--track-color', string> = {
          '--track-color': getTrackColor(trackIndex),
        };
        return (
          <div
            key={track.id}
            className={`timeline-row${isHeard(track.id, mix) ? '' : ' is-unheard'}`}
            style={rowStyle}
          >
            <div className={`timeline-track-name${isTrackSelected ? ' is-selected' : ''}`}>
              <button
                type="button"
                className="timeline-track-title"
                onClick={() => onSelect({ kind: 'track', trackId: track.id })}
                data-tooltip="the track: rename, remove"
              >
                {track.name}
              </button>
              <TrackMixButtons
                isMuted={mix.muted.includes(track.id)}
                isSoloed={mix.soloed.includes(track.id)}
                onToggleMute={() => onToggleMute(track.id)}
                onToggleSolo={() => onToggleSolo(track.id)}
              />
              <TrackMeter songId={song.id} trackId={track.id} />
              {nameEdge}
            </div>
            <div
              className="timeline-lane"
              {...{ [LANE_TRACK_ATTRIBUTE]: track.id }}
              onPointerDown={onPanStart}
              onClick={() => {
                if (!wasDragged()) onSelect(null);
              }}
            >
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
