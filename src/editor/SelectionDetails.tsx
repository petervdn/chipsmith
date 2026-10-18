// The details of what is selected, as sections one under the other: a block's section with its
// clip's under it, a clip's alone, or a track's; with nothing selected, a line on what to tap. The
// block's edits are made here, through the draft.
import type { Clip } from '../../shared/clip.schema.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.schema.ts';
import { BlockDetails } from './BlockDetails.tsx';
import { ClipDetails } from './ClipDetails.tsx';
import type { LoopRange } from './loop-range.ts';
import { getBlockRange } from './loop-range.ts';
import type { BlockPlace } from './song-edits.ts';
import {
  duplicateBlock,
  getBlock,
  getClipPlaces,
  removeBlock,
  removeTrack,
  renameTrack,
  setRepeats,
  trimBlock,
} from './song-edits.ts';
import { getBlockSpans, getTicksPerBar } from './timeline.ts';
import { TrackDetails } from './TrackDetails.tsx';
import type { useSongDraft } from './use-song-draft.ts';
import { getVersions } from './versions.ts';
import './SelectionDetails.css';

type SelectionDetailsProps = {
  song: Song;
  draft: ReturnType<typeof useSongDraft>;
  clips: Clip[];
  poolClips: Clip[];
  soloed: string[];
  onToggleSolo: (trackId: string) => void;
  onPlayFrom: (seconds: number) => void;
  onLoopRange: (range: LoopRange) => void;
  onUseTake: (clipId: string) => void;
  getPlaceTicks: (place: BlockPlace) => number;
};

/**
 * Shows the details of what is selected.
 *
 * @param props - The component's props.
 * @param props.song - The song as edited.
 * @param props.draft - The draft: the selection, and the edits and selecting.
 * @param props.clips - The clips the song's blocks play.
 * @param props.poolClips - Every clip, to find a clip's takes in; empty while they load.
 * @param props.soloed - The tracks soloed.
 * @param props.onToggleSolo - Called with a track's id to solo it or stop soloing it.
 * @param props.onPlayFrom - Called with a second to play the song from there.
 * @param props.onLoopRange - Called with bars to loop round.
 * @param props.onUseTake - Called with a take's id to put it in place of the selected clip.
 * @param props.getPlaceTicks - Gives the length in ticks of the clip a block plays.
 * @returns The details' element.
 */
export function SelectionDetails({
  song,
  draft,
  clips,
  poolClips,
  soloed,
  onToggleSolo,
  onPlayFrom,
  onLoopRange,
  onUseTake,
  getPlaceTicks,
}: SelectionDetailsProps) {
  const { selection } = draft;
  const ticksPerBar = getTicksPerBar(song);
  const place = selection?.kind === 'block' ? selection.place : null;
  const span = place
    ? getBlockSpans(song, clips).find(
        (candidate) => candidate.trackId === place.trackId && candidate.index === place.index,
      )
    : undefined;
  const clipId = selection?.kind === 'clip' ? selection.clipId : span?.clipId;
  const clip = clips.find((candidate) => candidate.id === clipId);
  const track =
    selection?.kind === 'track'
      ? song.tracks.find((candidate) => candidate.id === selection.trackId)
      : undefined;
  function replaceClip(fromClipId: string, toClipId: string): void {
    draft.replaceClip(fromClipId, toClipId);
    if (selection?.kind === 'clip' && selection.clipId === fromClipId) {
      draft.select({ kind: 'clip', clipId: toClipId });
    }
  }
  if (!selection) {
    return (
      <div className="selection-details">
        <p className="selection-details-hint">
          Tap a block, a clip or a track's name to see it here. Drag a block to move it, its edges
          to trim it.
        </p>
      </div>
    );
  }
  return (
    <div className="selection-details">
      {place && span && (
        <BlockDetails
          song={song}
          span={span}
          clip={clip}
          isSoloed={soloed.includes(span.trackId)}
          onPlayFrom={onPlayFrom}
          onLoop={() => {
            const range = getBlockRange(span, ticksPerBar);
            onLoopRange(range);
            onPlayFrom((range.startBar * ticksPerBar) / getTicksPerSecond(song.bpm));
          }}
          onToggleSolo={() => onToggleSolo(span.trackId)}
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
      {clip && (
        <ClipDetails
          songId={song.id}
          clip={clip}
          versions={getVersions(clip.id, poolClips.length > 0 ? poolClips : clips)}
          blockCount={getClipPlaces(song.tracks, clip.id).length}
          onUseVersion={onUseTake}
          onReplaceClip={replaceClip}
        />
      )}
      {track && (
        <TrackDetails
          track={track}
          onRename={(name) => draft.changeTracks((tracks) => renameTrack(tracks, track.id, name))}
          onRemove={() => {
            draft.changeTracks((tracks) => removeTrack(tracks, track.id));
            draft.select(null);
          }}
        />
      )}
    </div>
  );
}
