// The takes of the selected block's clip as pills (docs/adr/0037): the original and every variation
// made from it, each by its label, the one in the block marked; a tap puts that take in the block.
// The take in the block can be renamed in place.
import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import type { Clip } from '../../shared/clip.types.ts';
import { useSetVariationLabel } from '../queries/clips.ts';
import './ClipTakes.css';

type ClipTakesProps = {
  versions: Clip[];
  currentClipId: string;
  onUse: (clipId: string) => void;
};

/**
 * Shows the takes of a clip, to put one in the block or rename the one in it.
 *
 * @param props - The component's props.
 * @param props.versions - The clip's line of versions, oldest first.
 * @param props.currentClipId - The clip the block plays.
 * @param props.onUse - Called with a take's id to put it in the block.
 * @returns The takes' element.
 */
export function ClipTakes({ versions, currentClipId, onUse }: ClipTakesProps) {
  const [renamed, setRenamed] = useState<string | null>(null);
  const { mutate: setLabel, error } = useSetVariationLabel();
  const current = versions.find((version) => version.id === currentClipId);
  function saveLabel(): void {
    const label = renamed?.trim();
    if (label && current) setLabel({ clipId: current.id, variationLabel: label });
    setRenamed(null);
  }
  return (
    <div className="clip-takes">
      <h3 className="clip-takes-title">Takes</h3>
      <div className="clip-takes-pills">
        {versions.map((version) => (
          <button
            key={version.id}
            type="button"
            className={`clip-takes-pill${version.id === currentClipId ? ' is-current' : ''}`}
            aria-pressed={version.id === currentClipId}
            onClick={() => onUse(version.id)}
            data-tooltip={`${version.id} · made ${version.created.slice(0, 10)}`}
          >
            {version.variationLabel ?? 'original'}
          </button>
        ))}
        {current?.variationLabel && renamed === null && (
          <button
            type="button"
            className="clip-takes-rename"
            onClick={() => setRenamed(current.variationLabel ?? '')}
            data-tooltip="rename the take in this block"
            aria-label="rename the take in this block"
          >
            <Pencil />
          </button>
        )}
      </div>
      {renamed !== null && (
        <form
          className="clip-takes-name"
          onSubmit={(event) => {
            event.preventDefault();
            saveLabel();
          }}
        >
          <input
            value={renamed}
            onChange={(event) => setRenamed(event.target.value)}
            aria-label="the take's name"
            autoFocus
          />
          <button type="submit" disabled={!renamed.trim()} aria-label="save the name">
            <Check />
          </button>
          <button type="button" onClick={() => setRenamed(null)} aria-label="keep the old name">
            <X />
          </button>
        </form>
      )}
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
