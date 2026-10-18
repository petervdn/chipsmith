// A selected clip's family tree (docs/adr/0037): the original and every take made from it, each
// under the clip it was made from, the one shown marked. A tap shows that clip instead; nothing in
// the song changes. The clip shown can be renamed or deleted when it is a take (TakeActions.tsx).
import { CornerDownRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { TakeActions } from './TakeActions.tsx';
import type { VersionRow } from './versions.ts';
import './ClipFamily.css';

type ClipFamilyProps = {
  rows: VersionRow[];
  currentClipId: string;
  songId: string;
  onSelect: (clipId: string) => void;
  onReplaceClip: (fromClipId: string, toClipId: string) => void;
};

/**
 * Shows a clip's family tree, to look at another of its versions.
 *
 * @param props - The component's props.
 * @param props.rows - The family in the tree's order, each version with its depth.
 * @param props.currentClipId - The clip shown.
 * @param props.songId - The song it is edited in.
 * @param props.onSelect - Called with a version's id to show it.
 * @param props.onReplaceClip - Called with a deleted take's id and the clip that replaces it, to put
 *   that clip in the draft's blocks.
 * @returns The family's element.
 */
export function ClipFamily({
  rows,
  currentClipId,
  songId,
  onSelect,
  onReplaceClip,
}: ClipFamilyProps) {
  const current = rows.find(({ clip }) => clip.id === currentClipId)?.clip;
  return (
    <div className="clip-family">
      <h3 className="clip-family-title">Family tree</h3>
      <ul className="clip-family-tree">
        {rows.map(({ clip, depth }) => {
          const depthStyle: CSSProperties & Record<'--depth', string> = {
            '--depth': String(depth),
          };
          const isCurrent = clip.id === currentClipId;
          return (
            <li key={clip.id} style={depthStyle}>
              <button
                type="button"
                className={`clip-family-node${isCurrent ? ' is-current' : ''}`}
                aria-current={isCurrent}
                onClick={() => onSelect(clip.id)}
                data-tooltip={isCurrent ? 'the clip shown' : `show this one · ${clip.id}`}
              >
                {depth > 0 && <CornerDownRight className="clip-family-mark" />}
                {clip.variationLabel ?? 'original'}
              </button>
            </li>
          );
        })}
      </ul>
      {current && <TakeActions take={current} songId={songId} onReplaceClip={onReplaceClip} />}
    </div>
  );
}
