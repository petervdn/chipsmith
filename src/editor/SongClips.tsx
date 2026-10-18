// The clips the song plays, in a column at the right of the timeline: each with its name, length,
// channels and how many blocks play it, and its takes under it, indented and smaller: each its label
// and its blocks, a take of a take indented under the take it was made from; then the takes on their
// way, turning, with how far each is. A tap selects the clip; a drag puts a new block of it on a
// track (a chip of it follows the pointer). » folds the column to a strip and « opens it again; on a
// phone it starts folded, and open it lies over the timeline and steps aside while a clip is
// dragged. It knows nothing of how a drop is placed.
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { getClipLabel } from '../../shared/clip-label.ts';
import { formatSeconds } from '../format.ts';
import type { PendingTake } from './pending-takes.ts';
import { SongClipRow } from './SongClipRow.tsx';
import type { SongClip } from './song-clips.ts';
import { getUsageText } from './song-clips.ts';
import type { ClipDrag } from './use-clip-drag.ts';
import '../jobs/jobs.css';
import './SongClips.css';

/** A screen wide enough for the column beside the timeline; a narrower one starts with it folded. */
const WIDE_SCREEN = '(min-width: 720px)';

type SongClipsProps = {
  songClips: SongClip[];
  pendingTakes: PendingTake[];
  selectedClipId: string | null;
  waitingClipIds: string[];
  drag: ClipDrag | null;
  onPress: (event: ReactPointerEvent<HTMLElement>, clipId: string) => void;
  onSelect: (clipId: string) => void;
};

/**
 * Shows the song's clips in a column, to select and to drag onto the timeline.
 *
 * @param props - The component's props.
 * @param props.songClips - The clips, in the order the song first plays them, with their blocks and
 *   their takes.
 * @param props.pendingTakes - The takes on their way, each under the clip it is listed with.
 * @param props.selectedClipId - The clip selected, or null (a block's clip is not: a block is not its clip).
 * @param props.waitingClipIds - The clips whose audio is still being rendered.
 * @param props.drag - The clip being dragged, or null.
 * @param props.onPress - Called on a press on a clip, which may become a drag.
 * @param props.onSelect - Called with a clip's id when it is tapped.
 * @returns The column's element.
 */
export function SongClips({
  songClips,
  pendingTakes,
  selectedClipId,
  waitingClipIds,
  drag,
  onPress,
  onSelect,
}: SongClipsProps) {
  const [isOpen, setOpen] = useState(() => window.matchMedia(WIDE_SCREEN).matches);
  const dragged = songClips
    .flatMap(({ clip, blockCount, takes }) => [{ clip, blockCount }, ...takes])
    .find(({ clip }) => clip.id === drag?.clipId);
  /**
   * Returns what a clip's row says after its name: its length and how often the song uses it, or
   * that its audio is still being rendered.
   *
   * @param clip - The clip.
   * @param blockCount - How many blocks of the song play it.
   * @returns The facts, in words.
   */
  function getFacts(clip: Clip, blockCount: number): string {
    const usage = waitingClipIds.includes(clip.id) ? 'rendering…' : getUsageText(blockCount);
    return `${formatSeconds(clip.seconds)} · ${usage}`;
  }
  /**
   * Returns the classes that mark a clip's row as selected or dragged.
   *
   * @param clipId - The clip's id.
   * @returns The classes, each with a space before it, or nothing.
   */
  function getStateClasses(clipId: string): string {
    return `${clipId === selectedClipId ? ' is-selected' : ''}${clipId === drag?.clipId ? ' is-dragged' : ''}`;
  }
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
          <ChevronsLeft />
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
            <ChevronsRight />
          </button>
        </header>
        <p className="song-clips-hint">Drag one onto a track to place it.</p>
        <ul className="song-clips-list">
          {songClips.map(({ clip, blockCount, takes }) => {
            const pending = pendingTakes.filter((take) => take.clipId === clip.id);
            return (
              <li key={clip.id}>
                <SongClipRow
                  label={getClipLabel(clip)}
                  facts={getFacts(clip, blockCount)}
                  stateClasses={getStateClasses(clip.id)}
                  onPointerDown={(event) => onPress(event, clip.id)}
                  onClick={() => onSelect(clip.id)}
                />
                {takes.length + pending.length > 0 && (
                  <ul className="song-clips-takes" aria-label={`takes of ${getClipLabel(clip)}`}>
                    {takes.map(({ clip: take, blockCount: takeBlockCount, depth }) => (
                      <li key={take.id} style={getDepthStyle(depth)}>
                        <SongClipRow
                          label={getTakeLabel(take)}
                          facts={getFacts(take, takeBlockCount)}
                          stateClasses={getStateClasses(take.id)}
                          tooltip={`a take of ${getClipLabel(clip)}`}
                          onPointerDown={(event) => onPress(event, take.id)}
                          onClick={() => onSelect(take.id)}
                        />
                      </li>
                    ))}
                    {pending.map(({ key, depth, label, stateText }) => (
                      <li key={key} style={getDepthStyle(depth)}>
                        <SongClipRow label={label} facts={stateText} isPending />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {drag && dragged && (
        <div
          className="song-clips-ghost"
          style={{
            width: drag.grab.width,
            transform: `translate(${drag.x - drag.grab.x}px, ${drag.y - drag.grab.y}px)`,
          }}
          aria-hidden="true"
        >
          <SongClipRow
            label={
              dragged.clip.variationLabel ? getTakeLabel(dragged.clip) : getClipLabel(dragged.clip)
            }
            facts={getFacts(dragged.clip, dragged.blockCount)}
          />
        </div>
      )}
    </aside>
  );
}

/**
 * Returns the style that indents a take by how many takes deep it is.
 *
 * @param depth - How many takes deep it is: a take of the clip is 1.
 * @returns The style, the depth as a custom property.
 */
function getDepthStyle(depth: number): CSSProperties & Record<'--depth', string> {
  return { '--depth': String(depth) };
}

/**
 * Returns a take's name in the column: its label, or the clip's own for a take without one.
 *
 * @param take - The take.
 * @returns The name.
 */
function getTakeLabel(take: Clip): string {
  return take.variationLabel ?? getClipLabel(take);
}
