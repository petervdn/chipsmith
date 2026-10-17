// An opened song in the editor: the bar of controls (play, undo and redo, the grid, a new track,
// zoom, save and revert), the timeline of the draft, and the selected block's or track's details.
import { useRef, useState } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { useClips } from '../queries/clips.ts';
import { useSplitSong } from '../queries/songs.ts';
import { BlockDetails } from './BlockDetails.tsx';
import { ControlGroup } from './ControlGroup.tsx';
import { BAR_STEP, GRID_STEPS } from './grid.ts';
import {
  addTrack,
  duplicateBlock,
  getBlock,
  removeBlock,
  removeTrack,
  renameTrack,
  setRepeats,
  trimBlock,
} from './song-edits.ts';
import type { BlockPlace } from './song-edits.ts';
import { ROW_HEIGHT, Timeline } from './Timeline.tsx';
import { getBlockSpans, getClipTicks, getSongSplitCount, getTicksPerBar } from './timeline.ts';
import { SongClips } from './SongClips.tsx';
import { getFirstBlockPlace, getSongClips } from './song-clips.ts';
import { TrackDetails } from './TrackDetails.tsx';
import { TransportButtons } from './TransportButtons.tsx';
import { useBlockDrag } from './use-block-drag.ts';
import { useClipDrag } from './use-clip-drag.ts';
import { useEdgeScroll } from './use-edge-scroll.ts';
import { useEditorKeys } from './use-editor-keys.ts';
import { useElementWidth } from './use-element-width.ts';
import { useSongDraft } from './use-song-draft.ts';
import { useHeardTracks } from './use-heard-tracks.ts';
import { useSongTransport } from './use-song-transport.ts';
import { useTimelinePan } from './use-timeline-pan.ts';
import { useTrackMix } from './use-track-mix.ts';
import { TRACK_NAME_WIDTH, useZoom } from './use-zoom.ts';
import { useWheelZoom } from './use-wheel-zoom.ts';
import { getVersions } from './versions.ts';
import '../jobs/jobs.css';
import './SongEditor.css';
import { askToConfirm } from '../stores/confirm-store.ts';

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
  const transport = useSongTransport({ ...detail, song: draftSong });
  const width = useElementWidth(scrollRef);
  const { pixelsPerBar, zoomIn, zoomOut, fit, zoomTo } = useZoom({ song: draftSong, clips, width });
  useWheelZoom(scrollRef, { pixelsPerBar, trackNameWidth: TRACK_NAME_WIDTH, zoomTo });
  const ticksPerBar = getTicksPerBar(song);
  function getPlaceTicks(place: BlockPlace): number {
    return getClipTicks(clips, getBlock(draft.tracks, place)?.clip ?? '', song.bpm);
  }
  const drag = useBlockDrag({
    tracks: draft.tracks,
    pixelsPerTick: pixelsPerBar / ticksPerBar,
    rowHeight: ROW_HEIGHT,
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
  useEdgeScroll(scrollRef, {
    isDragging: drag.preview !== null || clipDrag.drag !== null,
    leftInset: TRACK_NAME_WIDTH,
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
      <div className="song-editor-bar">
        <TransportButtons
          mode={transport.mode}
          isPaused={transport.isPaused}
          isWaitingForAudio={isWaitingForAudio}
          onStop={transport.stop}
          onTogglePlaying={transport.togglePlaying}
        />
        <ControlGroup label="edit">
          <button
            type="button"
            onClick={draft.undo}
            disabled={!draft.canUndo}
            data-tooltip="undo (⌘Z)"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={draft.redo}
            disabled={!draft.canRedo}
            data-tooltip="redo (⇧⌘Z)"
          >
            ↷
          </button>
        </ControlGroup>
        <ControlGroup label="snap">
          <select
            className="song-editor-grid"
            value={step.id}
            onChange={(event) =>
              setStep(
                GRID_STEPS.find((candidate) => candidate.id === event.target.value) ?? BAR_STEP,
              )
            }
            data-tooltip="what blocks snap to when dragged (Alt: no snapping)"
          >
            {GRID_STEPS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </ControlGroup>
        {splitCount > 0 && (
          <ControlGroup label="tracks">
            <button
              type="button"
              className="song-editor-button"
              onClick={async () => {
                const question = getSplitQuestion(splitCount);
                if (!(await askToConfirm({ question, answer: 'Split' }))) return;
                transport.stop();
                splitSong(song.id);
              }}
              disabled={draft.hasChanges || isSplitting}
              data-tooltip={
                draft.hasChanges
                  ? 'save or revert the changes first'
                  : 'make a track per channel, each the whole song on that channel alone'
              }
            >
              {isSplitting ? 'Splitting…' : `Split into ${splitCount} channels`}
            </button>
          </ControlGroup>
        )}
        <ControlGroup label="zoom">
          <button type="button" onClick={zoomOut} data-tooltip="zoom out">
            −
          </button>
          <button type="button" onClick={fit} data-tooltip="fit the song to the screen">
            fit
          </button>
          <button type="button" onClick={zoomIn} data-tooltip="zoom in">
            +
          </button>
        </ControlGroup>
        <ControlGroup label="song" isAtEnd>
          {draft.hasChanges && <span className="song-editor-unsaved">unsaved changes</span>}
          {draft.hasChanges && (
            <button type="button" className="song-editor-button" onClick={draft.revert}>
              Revert
            </button>
          )}
          <button
            type="button"
            className="song-editor-button is-primary"
            onClick={draft.save}
            disabled={!draft.hasChanges || draft.isSaving}
            data-tooltip="save the song as it is now (⌘S)"
          >
            {draft.isSaving ? 'Saving…' : 'Save'}
          </button>
        </ControlGroup>
      </div>
      {draft.saveError && <p className="error">{draft.saveError.message}</p>}
      {splitError && <p className="error">{splitError.message}</p>}
      {waitingClipIds.length > 0 && (
        <p className="song-editor-progress">
          <span className="jobs-spinner" aria-hidden="true" />
          Rendering the pieces: {clips.length - waitingClipIds.length} of {clips.length} done. They
          play once all are rendered.
        </p>
      )}
      <div ref={scrollRef} className="song-editor-scroll">
        <Timeline
          song={shownSong}
          clips={clips}
          pixelsPerBar={pixelsPerBar}
          selection={selection}
          mix={mix}
          cursor={transport.cursor}
          onSelect={draft.select}
          onMoveTo={transport.moveTo}
          onPress={drag.startPress}
          wasDragged={() => drag.wasDragged() || pan.wasPanned()}
          onToggleMute={toggleMute}
          onToggleSolo={toggleSolo}
          onAddTrack={() => draft.changeTracks(addTrack)}
          onPanStart={pan.startPan}
          waitingClipIds={waitingClipIds}
        />
      </div>
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
                { start: span.start - (getBlock(tracks, place)?.trim?.offset ?? 0), trim: null },
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
          Tap a block or a track's name to see it. Drag a block to move it, its edges to trim it.
        </p>
      )}
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
