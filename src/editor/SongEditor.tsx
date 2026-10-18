// An opened song in the editor: the bar of controls (play, undo and redo, the grid, a new track,
// zoom, save and revert) and the timeline's head under it, which stay in view at the top, the
// timeline of the draft with the song's clips in a column at its right, and under it the details of
// the block, clip or track selected, a take swapped into
// the selected block or clip among its edits.
import { useRef, useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { useClips } from '../queries/clips.ts';
import { useSplitSong } from '../queries/songs.ts';
import { EditorBar } from './EditorBar.tsx';
import { BAR_STEP } from './grid.ts';
import { addTrack, getBlock, removeBlock, setTrackVolume } from './song-edits.ts';
import type { BlockPlace } from './song-edits.ts';
import { Timeline } from './Timeline.tsx';
import { TimelineHead } from './TimelineHead.tsx';
import { getClipTicks, getSongSplitCount, getTicksPerBar } from './timeline.ts';
import { SongClips } from './SongClips.tsx';
import { getEditorClips, getSongClips } from './song-clips.ts';
import { SelectionDetails } from './SelectionDetails.tsx';
import { useTakeSwap } from './use-take-swap.ts';
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
import { Mixer } from './Mixer.tsx';
import { useMetronome } from './use-metronome.ts';
import { useScrollSync } from './use-scroll-sync.ts';
import { useStickyTracks } from './use-sticky-tracks.ts';
import { useTimelinePan } from './use-timeline-pan.ts';
import { useTrackMix } from './use-track-mix.ts';
import { useTrackNameResize } from './use-track-name-resize.ts';
import { useZoom } from './use-zoom.ts';
import { useWheelZoom } from './use-wheel-zoom.ts';
import '../jobs/jobs.css';
import './SongEditor.css';
import { askToConfirm } from '../stores/confirm-store.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { useHeightProperty } from '../use-height-property.ts';
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
  const [scrub, setScrub] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headScrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const tracksMarkRef = useRef<HTMLDivElement>(null);
  const tracksRoomRef = useRef<HTMLDivElement>(null);
  useHeightProperty(headRef, '--editor-head-height');
  useScrollSync(scrollRef, headScrollRef);
  const { song, isWaitingForAudio, waitingClipIds } = detail;
  const { data: pool } = useClips();
  const poolClips = (pool ?? []).map((listing) => listing.clip);
  const { mutate: splitSong, isPending: isSplitting, error: splitError } = useSplitSong();
  const splitCount = getSongSplitCount(song, detail.clips);
  const draft = useSongDraft(detail);
  const clips = getEditorClips(draft.tracks, detail.clips, poolClips);
  const { mix, toggleMute, toggleSolo } = useTrackMix();
  const draftSong = { ...song, tracks: draft.tracks };
  useHeardTracks(draft.tracks, mix);
  const loop = useLoop(draftSong, clips);
  const transport = useSongTransport({ ...detail, song: draftSong, clips }, loop.loop);
  useMetronome(transport.mode === 'playing', song);
  const width = useElementWidth(scrollRef);
  const { trackNameWidth, resizeHandlers } = useTrackNameResize();
  const trackHeight = usePreferencesStore((state) => state.trackHeight);
  const { showTrack } = useStickyTracks(scrollRef, tracksMarkRef, tracksRoomRef, trackHeight + 1);
  const { pixelsPerBar, zoomIn, zoomOut, fit, zoomTo } = useZoom({
    song: draftSong,
    clips,
    width,
    trackNameWidth,
  });
  useWheelZoom(scrollRef, { pixelsPerBar, trackNameWidth, zoomTo });
  useWheelZoom(headScrollRef, { pixelsPerBar, trackNameWidth, zoomTo });
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
  function setVolume(trackId: string, volume: number): void {
    draft.changeTracks((tracks) => setTrackVolume(tracks, trackId, volume), `volume ${trackId}`);
  }
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
  const selectedClipId = selection?.kind === 'clip' ? selection.clipId : null;
  const putTake = useTakeSwap({
    tracks: draft.tracks,
    place,
    selectedClipId,
    selectClip: (clipId) => draft.select({ kind: 'clip', clipId }),
    clips: [...clips, ...poolClips],
    bpm: song.bpm,
    edit: draft.edit,
  });
  const preview = drag.preview ?? clipDrag.drag?.preview;
  const shownSong = preview ? { ...song, tracks: preview.tracks } : draftSong;
  return (
    <div className="song-editor">
      {draft.saveError && <p className="error">{draft.saveError.message}</p>}
      {splitError && <p className="error">{splitError.message}</p>}
      {waitingClipIds.length > 0 && (
        <p className="song-editor-progress">
          <span className="jobs-spinner" aria-hidden="true" />
          Rendering the pieces: {clips.length - waitingClipIds.length} of {clips.length} done. They
          play once all are rendered.
        </p>
      )}
      <div ref={headRef} className="song-editor-head">
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
        <div ref={headScrollRef} className="song-editor-head-scroll">
          <TimelineHead
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
            trackNameWidth={trackNameWidth}
            resizeHandlers={resizeHandlers}
            cursor={transport.cursor}
            scrub={scrub}
            onScrub={setScrub}
            onMoveTo={transport.moveTo}
            onAddTrack={() => draft.changeTracks(addTrack)}
            onPanStart={pan.startPan}
            wasPanned={pan.wasPanned}
            onClearSelection={() => draft.select(null)}
          />
        </div>
      </div>
      <div className="song-editor-body">
        <div className="song-editor-main">
          <div ref={tracksMarkRef} />
          <div ref={scrollRef} className="song-editor-scroll">
            <Timeline
              song={shownSong}
              clips={clips}
              pixelsPerBar={pixelsPerBar}
              trackHeight={trackHeight}
              trackNameWidth={trackNameWidth}
              resizeHandlers={resizeHandlers}
              selection={selection}
              mix={mix}
              cursor={transport.cursor}
              scrub={scrub}
              onSelect={draft.select}
              onPress={drag.startPress}
              wasDragged={() => drag.wasDragged() || pan.wasPanned()}
              onToggleMute={toggleMute}
              onToggleSolo={toggleSolo}
              onPanStart={pan.startPan}
              waitingClipIds={waitingClipIds}
            />
          </div>
          <div ref={tracksRoomRef} />
          <Mixer
            songId={song.id}
            tracks={draft.tracks}
            mix={mix}
            selectedTrackId={selection?.kind === 'track' ? selection.trackId : null}
            onSelect={(trackId) => draft.select({ kind: 'track', trackId })}
            onVolume={setVolume}
            onToggleMute={toggleMute}
            onToggleSolo={toggleSolo}
          />
          <SelectionDetails
            song={draftSong}
            draft={draft}
            clips={clips}
            poolClips={poolClips}
            soloed={mix.soloed}
            onToggleSolo={toggleSolo}
            onPlayFrom={transport.playFrom}
            onLoopRange={loop.loopRange}
            onUseTake={(clipId) => void putTake(clipId)}
            getPlaceTicks={getPlaceTicks}
            onShowTrack={showTrack}
          />
        </div>
        <SongClips
          songClips={getSongClips(draft.tracks, clips)}
          selectedClipId={selectedClipId}
          waitingClipIds={waitingClipIds}
          drag={clipDrag.drag}
          onPress={clipDrag.startPress}
          onSelect={(clipId) => {
            if (!clipDrag.wasDragged()) draft.select({ kind: 'clip', clipId });
          }}
        />
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
