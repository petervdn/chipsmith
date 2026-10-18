// The selected track's details: its name to change, and removing it with its blocks (mute and solo
// are on the track's row).
import type { Track } from '../../shared/song.schema.ts';
import './TrackDetails.css';
import { askToConfirm } from '../stores/confirm-store.ts';

type TrackDetailsProps = {
  track: Track;
  onRename: (name: string) => void;
  onRemove: () => void;
};

/**
 * Shows the selected track's details.
 *
 * @param props - The component's props.
 * @param props.track - The track.
 * @param props.onRename - Called with its new name when the name field is left or Enter pressed.
 * @param props.onRemove - Called to remove it, once confirmed.
 * @returns The details' section element.
 */
export function TrackDetails({ track, onRename, onRemove }: TrackDetailsProps) {
  return (
    <section className="track-details">
      <input
        key={track.id}
        className="track-details-name"
        defaultValue={track.name}
        aria-label="track name"
        onBlur={(event) => onRename(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
      <span className="track-details-count">
        {track.blocks.length} {track.blocks.length === 1 ? 'block' : 'blocks'}
      </span>
      <div className="track-details-actions">
        <button
          type="button"
          className="track-details-remove"
          onClick={async () => {
            const question = `Remove "${track.name}" and its blocks?`;
            if (await askToConfirm({ question, answer: 'Remove', isDanger: true })) onRemove();
          }}
        >
          Remove track
        </button>
      </div>
    </section>
  );
}
