// The song's timeline: a ruler of bars, a row per track (its name, which selects it, and mute and
// solo) with its blocks, and the playhead. A tap or drag on the ruler moves the play position; a tap
// on a block selects it; blocks are dragged to move and trim them.
import { useRef, useState } from 'react';
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
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
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
 * @param props.onToggleMute - Called with a track's id to mute or unmute it.
 * @param props.onToggleSolo - Called with a track's id to solo it or stop soloing it.
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
  onToggleMute,
  onToggleSolo,
  wasDragged,
  waitingClipIds,
}: TimelineProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<number | null>(null);
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
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setScrub(getRulerSeconds(event, pixelsPerSecond));
          }}
          onPointerMove={(event) => {
            if (scrub !== null) setScrub(getRulerSeconds(event, pixelsPerSecond));
          }}
          onPointerUp={(event) => {
            if (scrub === null) return;
            onMoveTo(getRulerSeconds(event, pixelsPerSecond));
            setScrub(null);
          }}
          onPointerCancel={() => setScrub(null)}
          title="tap or drag to move the play position"
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
                title="the track: rename, remove"
              >
                {track.name}
              </button>
              <span className="timeline-track-mix">
                <button
                  type="button"
                  className={mix.muted.includes(track.id) ? 'is-on' : ''}
                  onClick={() => onToggleMute(track.id)}
                  aria-pressed={mix.muted.includes(track.id)}
                  title="mute (while editing, not saved)"
                >
                  M
                </button>
                <button
                  type="button"
                  className={`is-solo${mix.soloed.includes(track.id) ? ' is-on' : ''}`}
                  onClick={() => onToggleSolo(track.id)}
                  aria-pressed={mix.soloed.includes(track.id)}
                  title="solo (while editing, not saved)"
                >
                  S
                </button>
              </span>
            </div>
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
