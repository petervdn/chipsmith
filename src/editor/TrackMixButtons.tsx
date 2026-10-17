// A track's M and S: mute and solo while editing (not saved), in its row and in the mixer alike. It
// knows nothing of how they are kept.
import './TrackMixButtons.css';

type TrackMixButtonsProps = {
  isMuted: boolean;
  isSoloed: boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
};

/**
 * Shows a track's mute and solo buttons.
 *
 * @param props - The component's props.
 * @param props.isMuted - Whether the track is muted.
 * @param props.isSoloed - Whether it is soloed.
 * @param props.onToggleMute - Called to mute or unmute it.
 * @param props.onToggleSolo - Called to solo it or stop soloing it.
 * @returns The buttons' element.
 */
export function TrackMixButtons({
  isMuted,
  isSoloed,
  onToggleMute,
  onToggleSolo,
}: TrackMixButtonsProps) {
  return (
    <span className="track-mix-buttons">
      <button
        type="button"
        className={isMuted ? 'is-on' : ''}
        onClick={onToggleMute}
        aria-pressed={isMuted}
        data-tooltip="mute (while editing, not saved)"
      >
        M
      </button>
      <button
        type="button"
        className={`is-solo${isSoloed ? ' is-on' : ''}`}
        onClick={onToggleSolo}
        aria-pressed={isSoloed}
        data-tooltip="solo (while editing, not saved)"
      >
        S
      </button>
    </span>
  );
}
