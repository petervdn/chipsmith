// Create on the New page, with how many songs under it, small: the column at the right of the
// prompt, staying in view as the page scrolls.
import './CreatePanel.css';

/** The most songs a prompt can make. */
const MOST_SONGS = 6;

type CreatePanelProps = {
  songCount: number;
  canSend: boolean;
  isSending: boolean;
  onSongCountChange: (songCount: number) => void;
};

/**
 * Shows Create, which sends the prompt (its form's submit), and the number of songs under it.
 *
 * @param props - The component's props.
 * @param props.songCount - How many songs the prompt makes.
 * @param props.canSend - Whether there is a prompt to send.
 * @param props.isSending - Whether it is being sent.
 * @param props.onSongCountChange - Called with a new number of songs, 1 to MOST_SONGS.
 * @returns The panel's element.
 */
export function CreatePanel({
  songCount,
  canSend,
  isSending,
  onSongCountChange,
}: CreatePanelProps) {
  return (
    <div className="create-panel">
      <button type="submit" className="create-panel-send" disabled={!canSend || isSending}>
        {isSending ? 'Sending…' : `Create ${songCount} ${songCount === 1 ? 'song' : 'songs'}`}
      </button>
      <span className="create-panel-count" aria-label="how many songs">
        <button
          type="button"
          onClick={() => onSongCountChange(Math.max(1, songCount - 1))}
          disabled={songCount <= 1}
          data-tooltip="one song fewer"
        >
          −
        </button>
        <span className="create-panel-count-number">{songCount}</span>
        <button
          type="button"
          onClick={() => onSongCountChange(Math.min(MOST_SONGS, songCount + 1))}
          disabled={songCount >= MOST_SONGS}
          data-tooltip="one song more"
        >
          +
        </button>
      </span>
    </div>
  );
}
