// One clip in the song's clips column, the same for a clip, a take, a take on its way and the copy
// that follows the pointer while one is dragged: its name at the left, its facts at the right, on
// one line. A row with a press handler is a button; one without (on its way, the dragged copy) is
// not.
import type { PointerEvent as ReactPointerEvent } from 'react';
import './SongClipRow.css';

type SongClipRowProps = {
  label: string;
  facts: string;
  stateClasses?: string;
  isPending?: boolean;
  tooltip?: string;
  onPointerDown?: (event: ReactPointerEvent<HTMLElement>) => void;
  onClick?: () => void;
};

/**
 * Shows a clip of the column as one row.
 *
 * @param props - The component's props.
 * @param props.label - Its name: a clip's label, a take's.
 * @param props.facts - What follows it: its length and how often it is used, or how far it is.
 * @param props.stateClasses - Classes for how it is now (`is-selected`, `is-dragged`), each with a
 *   space before it.
 * @param props.isPending - Whether it is a take on its way: dashed and turning.
 * @param props.tooltip - What the mouse resting on it says.
 * @param props.onPointerDown - Called on a press, which may become a drag; without it the row is
 *   not a button.
 * @param props.onClick - Called when it is tapped.
 * @returns The row's element.
 */
export function SongClipRow({
  label,
  facts,
  stateClasses = '',
  isPending = false,
  tooltip,
  onPointerDown,
  onClick,
}: SongClipRowProps) {
  const className = `song-clip-row${isPending ? ' is-pending' : ''}${stateClasses}`;
  const content = (
    <>
      <span className="song-clip-row-name">
        {isPending && <span className="jobs-spinner" aria-hidden="true" />}
        {label}
      </span>
      <span className="song-clip-row-facts">{facts}</span>
    </>
  );
  if (!onPointerDown) {
    return (
      <div className={className} aria-busy={isPending || undefined} data-tooltip={tooltip}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onPointerDown={onPointerDown}
      onClick={onClick}
      data-tooltip={tooltip}
    >
      {content}
    </button>
  );
}
