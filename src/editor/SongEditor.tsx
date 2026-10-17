// An opened song as the editor shows it: ▶ / ■ from the cursor and the zoom above the timeline, the
// timeline, and the selected block's details below it. For now it reads; editing comes next.
import { useRef, useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { useClips } from '../queries/clips.ts';
import { BlockDetails } from './BlockDetails.tsx';
import type { BlockPlace } from './Timeline.tsx';
import { Timeline } from './Timeline.tsx';
import { getBlockSpans } from './timeline.ts';
import { useElementWidth } from './use-element-width.ts';
import { useSongTransport } from './use-song-transport.ts';
import { useZoom } from './use-zoom.ts';
import { getVersions } from './versions.ts';
import './SongEditor.css';

type SongEditorProps = { detail: SongDetail };

/**
 * Shows an opened song in the editor: ▶ / ■ from the cursor and the zoom above the timeline, the
 * timeline, and the selected block's details below it.
 *
 * @param props - The component's props.
 * @param props.detail - The opened song, with its clips.
 * @returns The song editor element.
 */
export function SongEditor({ detail }: SongEditorProps) {
  const [selected, setSelected] = useState<BlockPlace | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { song, clips, isWaitingForAudio } = detail;
  const width = useElementWidth(scrollRef);
  const { pixelsPerBar, zoomIn, zoomOut, fit } = useZoom({ song, clips, width });
  const { cursor, mode, togglePlaying, moveTo, playFrom } = useSongTransport(detail);
  const { data: pool } = useClips();
  const span = selected
    ? getBlockSpans(song, clips).find(
        (candidate) => candidate.trackId === selected.trackId && candidate.index === selected.index,
      )
    : undefined;
  const clip = clips.find((candidate) => candidate.id === span?.clipId);
  const poolClips = (pool ?? []).map((listing) => listing.clip);
  return (
    <div className="song-editor">
      <div className="song-editor-bar">
        <button
          type="button"
          className={`song-editor-play${mode === 'stopped' ? '' : ' is-on'}`}
          onClick={togglePlaying}
          disabled={isWaitingForAudio}
          title={mode === 'stopped' ? 'play from the cursor' : 'stop'}
        >
          {mode === 'stopped' ? '▶' : mode === 'loading' ? '…' : '■'}
        </button>
        <span className="song-editor-zoom">
          <button type="button" onClick={zoomOut} title="zoom out">
            −
          </button>
          <button type="button" onClick={fit} title="fit the song to the screen">
            fit
          </button>
          <button type="button" onClick={zoomIn} title="zoom in">
            +
          </button>
        </span>
      </div>
      <div ref={scrollRef} className="song-editor-scroll">
        <Timeline
          song={song}
          clips={clips}
          pixelsPerBar={pixelsPerBar}
          selected={selected}
          cursor={cursor}
          onSelect={setSelected}
          onMoveTo={moveTo}
        />
      </div>
      {span ? (
        <BlockDetails
          song={song}
          span={span}
          clip={clip}
          versions={clip ? getVersions(clip.id, poolClips.length > 0 ? poolClips : clips) : []}
          onPlayFrom={playFrom}
        />
      ) : (
        <p className="song-editor-hint">Tap a block to see its clip.</p>
      )}
    </div>
  );
}
