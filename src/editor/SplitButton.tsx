// Split into channels, left of Revert and Save on the song's title row (put there by
// SongEditor.tsx): only while the song is one whole clip of more than one channel; it makes a track
// per channel (docs/splitting.md), after asking, once the changes are saved or reverted.
import './SplitButton.css';

type SplitButtonProps = {
  splitCount: number;
  hasChanges: boolean;
  isSplitting: boolean;
  onSplit: () => void;
};

/**
 * Shows the button that splits the song into a track per channel.
 *
 * @param props - The component's props.
 * @param props.splitCount - Into how many channels the song can be split; 0 when it cannot.
 * @param props.hasChanges - Whether the song has changes not saved, which keep it from splitting.
 * @param props.isSplitting - Whether a split is on its way.
 * @param props.onSplit - Called to split the song (after asking).
 * @returns The button, or null when the song cannot be split.
 */
export function SplitButton({ splitCount, hasChanges, isSplitting, onSplit }: SplitButtonProps) {
  if (splitCount === 0) return null;
  return (
    <button
      type="button"
      className="split-button"
      onClick={onSplit}
      disabled={hasChanges || isSplitting}
      data-tooltip={
        hasChanges
          ? 'save or revert the changes first'
          : 'make a track per channel, each the whole song on that channel alone'
      }
    >
      {isSplitting ? 'Splitting…' : `Split into ${splitCount} channels`}
    </button>
  );
}
