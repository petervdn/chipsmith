// The selected track's details: its name to change, mute and solo (heard only while editing, not
// saved), and removing it with its blocks.
import type { Track } from '../../shared/song.types.ts';
import './TrackDetails.css';

type TrackDetailsProps = {
  track: Track;
  isMuted: boolean;
  isSoloed: boolean;
  onRename: (name: string) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onRemove: () => void;
};

/**
 * Shows the selected track's details.
 *
 * @param props - The component's props.
 * @param props.track - The track.
 * @param props.isMuted - Whether it is muted.
 * @param props.isSoloed - Whether it is soloed.
 * @param props.onRename - Called with its new name when the name field is left or Enter pressed.
 * @param props.onToggleMute - Called to mute or unmute it.
 * @param props.onToggleSolo - Called to solo it or stop soloing it.
 * @param props.onRemove - Called to remove it, once confirmed.
 * @returns The details' section element.
 */
export function TrackDetails({
  track,
  isMuted,
  isSoloed,
  onRename,
  onToggleMute,
  onToggleSolo,
  onRemove,
}: TrackDetailsProps) {
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
          className={isMuted ? 'is-on' : ''}
          onClick={onToggleMute}
          title="silence this track while editing (not saved)"
        >
          Mute
        </button>
        <button
          type="button"
          className={isSoloed ? 'is-on' : ''}
          onClick={onToggleSolo}
          title="hear only the soloed tracks while editing (not saved)"
        >
          Solo
        </button>
        <button
          type="button"
          className="track-details-remove"
          onClick={() => {
            if (window.confirm(`Remove "${track.name}" and its blocks?`)) onRemove();
          }}
        >
          Remove track
        </button>
      </div>
    </section>
  );
}
