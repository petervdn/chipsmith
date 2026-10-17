// The clips the song plays, under the timeline: each with its name, length, channels and how many
// blocks play it. A tap selects its first block; a drag puts a new block of it on a track (a chip of
// it follows the pointer). It knows nothing of how a drop is placed.
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import { getChannelName } from '../../shared/clip-channels.ts';
import { getClipLabel } from '../clips/ClipsPage.tsx';
import { formatSeconds } from '../format.ts';
import type { SongClip } from './song-clips.ts';
import type { ClipDrag } from './use-clip-drag.ts';
import './SongClips.css';

type SongClipsProps = {
  songClips: SongClip[];
  selectedClipId: string | null;
  waitingClipIds: string[];
  drag: ClipDrag | null;
  onPress: (event: ReactPointerEvent, clipId: string) => void;
  onSelect: (clipId: string) => void;
};

/**
 * Shows the song's clips, to select and to drag onto the timeline.
 *
 * @param props - The component's props.
 * @param props.songClips - The clips, in the order the song first plays them, with their blocks.
 * @param props.selectedClipId - The clip of the selected block, or null.
 * @param props.waitingClipIds - The clips whose audio is still being rendered.
 * @param props.drag - The clip being dragged, or null.
 * @param props.onPress - Called on a press on a clip, which may become a drag.
 * @param props.onSelect - Called with a clip's id when it is tapped.
 * @returns The clips' section element.
 */
export function SongClips({
  songClips,
  selectedClipId,
  waitingClipIds,
  drag,
  onPress,
  onSelect,
}: SongClipsProps) {
  const dragged = songClips.find(({ clip }) => clip.id === drag?.clipId)?.clip;
  return (
    <section className="song-clips">
      <h2 className="song-clips-title">
        Clips <span className="song-clips-hint">drag one onto a track to place it</span>
      </h2>
      <ul className="song-clips-list">
        {songClips.map(({ clip, blockCount }) => (
          <li key={clip.id}>
            <button
              type="button"
              className={`song-clips-clip${clip.id === selectedClipId ? ' is-selected' : ''}${clip.id === drag?.clipId ? ' is-dragged' : ''}`}
              onPointerDown={(event) => onPress(event, clip.id)}
              onClick={() => onSelect(clip.id)}
              data-tooltip={
                blockCount > 0
                  ? 'tap to select its first block; drag onto a track'
                  : 'drag onto a track'
              }
            >
              <span className="song-clips-name">
                {getClipLabel(clip)} <span className="song-clips-id">{clip.id}</span>
              </span>
              <span className="song-clips-facts">
                {formatSeconds(clip.seconds)} · {getChannelsText(clip)} ·{' '}
                {waitingClipIds.includes(clip.id) ? 'rendering…' : getBlockCountText(blockCount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {drag && dragged && (
        <span
          className="song-clips-ghost"
          style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
          aria-hidden="true"
        >
          {getClipLabel(dragged)} {drag.preview ? '' : '· over a track to place it'}
        </span>
      )}
    </section>
  );
}

/**
 * Returns the channels a clip plays, in words.
 *
 * @param clip - The clip.
 * @returns Its channels' names, or how many there are when more than two.
 */
function getChannelsText(clip: Clip): string {
  if (clip.channels.length > 2) return `${clip.channels.length} channels`;
  return clip.channels.map((channel) => getChannelName(clip.chips, channel)).join(', ');
}

/**
 * Returns how many blocks play a clip, in words.
 *
 * @param count - How many blocks play it.
 * @returns "1 block", "3 blocks", or "not placed".
 */
function getBlockCountText(count: number): string {
  if (count === 0) return 'not placed';
  return `${count} ${count === 1 ? 'block' : 'blocks'}`;
}
