// An opened song in the editor: the bar of controls (play, undo and redo, the grid, a new track,
// zoom, save and revert), the timeline of the draft, and the selected block's or track's details.
import { useRef, useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { useClips } from '../queries/clips.ts';
import { useSplitSong } from '../queries/songs.ts';
import { BlockDetails } from './BlockDetails.tsx';
import { EditorBar } from './EditorBar.tsx';
import { BAR_STEP } from './grid.ts';
import {
  addTrack,
  duplicateBlock,
  getBlock,
  removeBlock,
  removeTrack,
  renameTrack,
  setRepeats,
  setTrackVolume,
  trimBlock,
} from './song-edits.ts';
import type { BlockPlace } from './song-edits.ts';
import { Timeline } from './Timeline.tsx';
import { getBlockSpans, getClipTicks, getSongSplitCount, getTicksPerBar } from './timeline.ts';
import { SongClips } from './SongClips.tsx';
import { getFirstBlockPlace, getSongClips } from './song-clips.ts';
import { TrackDetails } from './TrackDetails.tsx';
import { useBlockDrag } from './use-block-drag.ts';
import { useClipDrag } from './use-clip-drag.ts';
import { useEdgeScroll } from './use-edge-scroll.ts';
import { useFollowPlayhead } from './use-follow-playhead.ts';
import { useEditorKeys } from './use-editor-keys.ts';
import { useElementWidth } from './use-element-width.ts';
import { useSongDraft } from './use-song-draft.ts';
import { useHeardTracks } from './use-heard-tracks.ts';
import { useSongTransport } from './use-song-transport.ts';
import { useLoop } from './use-loop.ts';
import { useMetronome } from './use-metronome.ts';
import { useTimelinePan } from './use-timeline-pan.ts';
import { useTrackMix } from './use-track-mix.ts';
import { useTrackNameResize } from './use-track-name-resize.ts';
import { useZoom } from './use-zoom.ts';
import { useWheelZoom } from './use-wheel-zoom.ts';
import { getVersions } from './versions.ts';
import '../jobs/jobs.css';
import './SongEditor.css';
import { askToConfirm } from '../stores/confirm-store.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';

type SongEditorProps = { detail: SongDetail };

/**
 * Shows the song editor.
 *
 * @param props - The component's props.
 * @param props.detail - The song as saved, with the clips it plays.
 * @returns The editor's element.
 */
export function SongEditor({ detail }: SongEditorProps) {
  const [step, setStep] = useState(BAR_STEP);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { song, clips, isWaitingForAudio, waitingClipIds } = detail;
  const { mutate: splitSong, isPending: isSplitting, error: splitError } = useSplitSong();
  const splitCount = getSongSplitCount(song, clips);
  const draft = useSongDraft(detail);
  const { mix, toggleMute, toggleSolo } = useTrackMix();
  const draftSong = { ...song, tracks: draft.tracks };
  useHeardTracks(draft.tracks, mix);
  const loop = useLoop(draftSong, clips);
  const transport = useSongTransport({ ...detail, song: draftSong }, loop.loop);
  useMetronome(transport.mode === 'playing', song);
  const width = useElementWidth(scrollRef);
  const { trackNameWidth, resizeHandlers } = useTrackNameResize();
  const trackHeight = usePreferencesStore((state) => state.trackHeight);
  const { pixelsPerBar, zoomIn, zoomOut, fit, zoomTo } = useZoom({
    song: draftSong,
    clips,
    width,
    trackNameWidth,
  });
  useWheelZoom(scrollRef, { pixelsPerBar, trackNameWidth, zoomTo });
  const ticksPerBar = getTicksPerBar(song);
  function getPlaceTicks(place: BlockPlace): number {
    return getClipTicks(clips, getBlock(draft.tracks, place)?.clip ?? '', song.bpm);
  }
  const drag = useBlockDrag({
    tracks: draft.tracks,
    pixelsPerTick: pixelsPerBar / ticksPerBar,
    rowHeight: trackHeight,
    step,
    ticksPerBar,
    getClipTicks: getPlaceTicks,
    onEdit: (edited) => draft.edit(() => edited),
  });
  const clipDrag = useClipDrag({
    tracks: draft.tracks,
    pixelsPerTick: pixelsPerBar / ticksPerBar,
    step,
    ticksPerBar,
    onEdit: (edited) => draft.edit(() => edited),
  });
  const pan = useTimelinePan(scrollRef);
  const isFollowingPlayhead = usePreferencesStore((state) => state.isFollowingPlayhead);
  const isStructureShown = usePreferencesStore((state) => state.isStructureShown);
  const structure = song.structure?.sections.length ? song.structure.sections : null;
  useFollowPlayhead(scrollRef, {
    songId: song.id,
    isOn: isFollowingPlayhead,
    pixelsPerSecond: (pixelsPerBar / ticksPerBar) * getTicksPerSecond(song.bpm),
    leftInset: trackNameWidth,
  });
  useEdgeScroll(scrollRef, {
    isDragging: drag.preview !== null || clipDrag.drag !== null,
    leftInset: trackNameWidth,
    onScroll: () => {
      drag.redrag();
      clipDrag.redrag();
    },
  });
  const { data: pool } = useClips();
  const selection = draft.selection;
  const place = selection?.kind === 'block' ? selection.place : null;
  useEditorKeys({
    togglePlaying: transport.togglePlaying,
    removeSelected: () => {
      if (place) draft.edit((tracks) => removeBlock(tracks, place));
    },
    undo: draft.undo,
    redo: draft.redo,
    save: draft.save,
    clearSelection: () => draft.select(null),
  });
  const span = place
    ? getBlockSpans(draftSong, clips).find(
        (candidate) => candidate.trackId === place.trackId && candidate.index === place.index,
      )
    : undefined;
  const clip = clips.find((candidate) => candidate.id === span?.clipId);
  const selectedTrack =
    selection?.kind === 'track'
      ? draft.tracks.find((track) => track.id === selection.trackId)
      : undefined;
  const poolClips = (pool ?? []).map((listing) => listing.clip);
  const preview = drag.preview ?? clipDrag.drag?.preview;
  const shownSong = preview ? { ...song, tracks: preview.tracks } : draftSong;
  return (
    <div className="song-editor">
      <EditorBar
        transport={transport}
        isWaitingForAudio={isWaitingForAudio}
        draft={draft}
        loop={loop}
        step={step}
        onStep={setStep}
        splitCount={splitCount}
        hasStructure={structure !== null}
        isSplitting={isSplitting}
        onSplit={async () => {
          const question = getSplitQuestion(splitCount);
          if (!(await askToConfirm({ question, answer: 'Split' }))) return;
          transport.stop();
          splitSong(song.id);
        }}
        zoom={{ zoomIn, zoomOut, fit }}
      />
      {draft.saveError && <p className="error">{draft.saveError.message}</p>}
      {splitError && <p className="error">{splitError.message}</p>}
      {waitingClipIds.length > 0 && (
        <p className="song-editor-progress">
          <span className="jobs-spinner" aria-hidden="true" />
          Rendering the pieces: {clips.length - waitingClipIds.length} of {clips.length} done. They
          play once all are rendered.
        </p>
      )}
      <div className="song-editor-body">
        <SongClips
          songClips={getSongClips(draft.tracks, clips)}
          selectedClipId={span?.clipId ?? null}
          waitingClipIds={waitingClipIds}
          drag={clipDrag.drag}
          onPress={clipDrag.startPress}
          onSelect={(clipId) => {
            if (clipDrag.wasDragged()) return;
            const first = getFirstBlockPlace(draft.tracks, clipId);
            if (first) draft.select({ kind: 'block', place: first });
          }}
        />
        <div className="song-editor-main">
          <div ref={scrollRef} className="song-editor-scroll">
            <Timeline
              song={shownSong}
              structure={isStructureShown ? structure : null}
              loop={
                loop.isOn
                  ? {
                      range: loop.range,
                      isWhole: loop.isWhole,
                      onChange: loop.setRange,
                      onWhole: loop.setWhole,
                    }
                  : null
              }
              clips={clips}
              pixelsPerBar={pixelsPerBar}
              trackHeight={trackHeight}
              trackNameWidth={trackNameWidth}
              resizeHandlers={resizeHandlers}
              selection={selection}
              mix={mix}
              cursor={transport.cursor}
              onSelect={draft.select}
              onMoveTo={transport.moveTo}
              onPress={drag.startPress}
              wasDragged={() => drag.wasDragged() || pan.wasPanned()}
              onToggleMute={toggleMute}
              onToggleSolo={toggleSolo}
              onVolume={(trackId, volume) =>
                draft.changeTracks(
                  (tracks) => setTrackVolume(tracks, trackId, volume),
                  `volume ${trackId}`,
                )
              }
              onAddTrack={() => draft.changeTracks(addTrack)}
              onPanStart={pan.startPan}
              waitingClipIds={waitingClipIds}
            />
          </div>
          {place && span && (
            <BlockDetails
              song={draftSong}
              span={span}
              clip={clip}
              versions={clip ? getVersions(clip.id, poolClips.length > 0 ? poolClips : clips) : []}
              onPlayFrom={transport.playFrom}
              onRepeats={(repeats) => draft.edit((tracks) => setRepeats(tracks, place, repeats))}
              onDuplicate={() =>
                draft.edit((tracks) => duplicateBlock(tracks, place, getPlaceTicks(place)))
              }
              onUntrim={() =>
                draft.edit((tracks) =>
                  trimBlock(
                    tracks,
                    place,
                    {
                      start: span.start - (getBlock(tracks, place)?.trim?.offset ?? 0),
                      trim: null,
                    },
                    getPlaceTicks(place),
                  ),
                )
              }
              onRemove={() => draft.edit((tracks) => removeBlock(tracks, place))}
            />
          )}
          {selectedTrack && (
            <TrackDetails
              track={selectedTrack}
              onRename={(name) =>
                draft.changeTracks((tracks) => renameTrack(tracks, selectedTrack.id, name))
              }
              onRemove={() => {
                draft.changeTracks((tracks) => removeTrack(tracks, selectedTrack.id));
                draft.select(null);
              }}
            />
          )}
          {!selection && (
            <p className="song-editor-hint">
              Tap a block or a track's name to see it. Drag a block to move it, its edges to trim
              it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Returns what Split asks before it splits.
 *
 * @param count - How many channels the song is split into.
 * @returns The question.
 */
function getSplitQuestion(count: number): string {
  return `Split this song into ${count} channels? Each becomes a track of its own, the whole song on that channel alone. The whole clip stays in the pool.`;
}
