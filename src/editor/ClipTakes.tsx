// What a selected block plays (docs/adr/0037): its clip and the clip's other takes as pills under
// "Plays", the one in the block marked; a tap puts that take in this block (and, asked, in the
// other blocks that play the same clip). The take in the block can be renamed or deleted
// (TakeActions.tsx).
import type { Clip } from '../../shared/clip.schema.ts';
import { TakeActions } from './TakeActions.tsx';
import './ClipTakes.css';

type ClipTakesProps = {
  versions: Clip[];
  currentClipId: string;
  songId: string;
  onUse: (clipId: string) => void;
  onReplaceClip: (fromClipId: string, toClipId: string) => void;
};

/**
 * Shows which take a block plays, to put another in its place, and rename or delete the one in it.
 *
 * @param props - The component's props.
 * @param props.versions - The clip's versions, oldest first.
 * @param props.currentClipId - The clip the block plays.
 * @param props.songId - The song the block is in.
 * @param props.onUse - Called with a take's id to put it in the block.
 * @param props.onReplaceClip - Called with a deleted take's id and the clip that replaces it, to put
 *   that clip in the draft's blocks.
 * @returns The takes' element.
 */
export function ClipTakes({
  versions,
  currentClipId,
  songId,
  onUse,
  onReplaceClip,
}: ClipTakesProps) {
  const current = versions.find((version) => version.id === currentClipId);
  return (
    <div className="clip-takes">
      <h3 className="clip-takes-title">Plays</h3>
      <div className="clip-takes-pills">
        {versions.map((version) => (
          <button
            key={version.id}
            type="button"
            className={`clip-takes-pill${version.id === currentClipId ? ' is-current' : ''}`}
            aria-pressed={version.id === currentClipId}
            onClick={() => onUse(version.id)}
            data-tooltip={
              version.id === currentClipId
                ? 'what this block plays'
                : `play this take in this block · ${version.id}`
            }
          >
            {version.variationLabel ?? 'original'}
          </button>
        ))}
        {current && <TakeActions take={current} songId={songId} onReplaceClip={onReplaceClip} />}
      </div>
    </div>
  );
}
