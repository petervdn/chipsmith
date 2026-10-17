// The clips the song plays, in a column at the left of the timeline: each with its name, length,
// channels and how many blocks play it. A tap selects its first block; a drag puts a new block of it
// on a track (a chip of it follows the pointer). « folds the column to a strip and » opens it again;
// on a phone it starts folded, and open it lies over the timeline and steps aside while a clip is
// dragged. It knows nothing of how a drop is placed.
import { useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import { getChannelName } from '../../shared/clip-channels.ts';
import { getClipLabel } from '../clips/ClipsPage.tsx';
import { formatSeconds } from '../format.ts';
import type { SongClip } from './song-clips.ts';
import type { ClipDrag } from './use-clip-drag.ts';
import './SongClips.css';

/** A screen wide enough for the column beside the timeline; a narrower one starts with it folded. */
const WIDE_SCREEN = '(min-width: 720px)';

type SongClipsProps = {
  songClips: SongClip[];
  selectedClipId: string | null;
  waitingClipIds: string[];
  drag: ClipDrag | null;
  onPress: (event: ReactPointerEvent, clipId: string) => void;
  onSelect: (clipId: string) => void;
};

/**
 * Shows the song's clips in a column, to select and to drag onto the timeline.
 *
 * @param props - The component's props.
 * @param props.songClips - The clips, in the order the song first plays them, with their blocks.
 * @param props.selectedClipId - The clip of the selected block, or null.
 * @param props.waitingClipIds - The clips whose audio is still being rendered.
 * @param props.drag - The clip being dragged, or null.
 * @param props.onPress - Called on a press on a clip, which may become a drag.
 * @param props.onSelect - Called with a clip's id when it is tapped.
 * @returns The column's element.
 */
export function SongClips({
  songClips,
  selectedClipId,
  waitingClipIds,
  drag,
  onPress,
  onSelect,
}: SongClipsProps) {
  const [isOpen, setOpen] = useState(() => window.matchMedia(WIDE_SCREEN).matches);
  const dragged = songClips.find(({ clip }) => clip.id === drag?.clipId)?.clip;
  if (!isOpen) {
    return (
      <aside className="song-clips is-folded">
        <button
          type="button"
          className="song-clips-fold"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-label="show the song's clips"
          data-tooltip="show the song's clips"
        >
          »
        </button>
        <span className="song-clips-strip-label">clips</span>
      </aside>
    );
  }
  return (
    <aside className={`song-clips${drag ? ' is-dragging' : ''}`}>
      <div className="song-clips-panel">
        <header className="song-clips-head">
          <h2 className="song-clips-title">clips</h2>
          <button
            type="button"
            className="song-clips-fold"
            onClick={() => setOpen(false)}
            aria-expanded={true}
            aria-label="fold the clips away"
            data-tooltip="fold the clips away"
          >
            «
          </button>
        </header>
        <p className="song-clips-hint">Drag one onto a track to place it.</p>
        <ul className="song-clips-list">
          {songClips.map(({ clip, blockCount }) => (
            <li key={clip.id}>
              <button
                type="button"
                className={`song-clips-clip${clip.id === selectedClipId ? ' is-selected' : ''}${clip.id === drag?.clipId ? ' is-dragged' : ''}`}
                onPointerDown={(event) => onPress(event, clip.id)}
                onClick={() => onSelect(clip.id)}
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
      </div>
      {drag && dragged && (
        <span
          className="song-clips-ghost"
          style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
          aria-hidden="true"
        >
          {getClipLabel(dragged)} {drag.preview ? '' : '· over a track to place it'}
        </span>
      )}
    </aside>
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
