// The buttons of a song's or a clip's row: ★ keeps it (pressed again, it goes back to heard), one
// flat shape, light grey until kept; and a quiet trash can deletes it, where it can be deleted.
import { Star, Trash2 } from 'lucide-react';
import type { Status } from '../../shared/catalogue.schema.ts';
import './StatusButtons.css';

type StatusButtonsProps = {
  status: Status;
  onChange: (status: Status) => void;
  onDelete?: () => void;
  deleteLabel?: string;
};

/**
 * Shows ★ for a status, which keeps the item and pressed again goes back to heard, and a trash can
 * when the item can be deleted.
 *
 * @param props - The component's props.
 * @param props.status - The status shown.
 * @param props.onChange - Called with the status chosen.
 * @param props.onDelete - Called when the trash can is pressed; without it there is no trash can.
 * @param props.deleteLabel - What the trash can's tooltip says it deletes.
 * @returns The buttons' element.
 */
export function StatusButtons({ status, onChange, onDelete, deleteLabel }: StatusButtonsProps) {
  return (
    <span className="status-buttons">
      <button
        type="button"
        className={`status-buttons-keep${status === 'keeper' ? ' is-on' : ''}`}
        data-tooltip={status === 'keeper' ? 'kept; press to undo' : 'keep'}
        aria-label={status === 'keeper' ? 'kept; press to undo' : 'keep'}
        onClick={() => onChange(status === 'keeper' ? 'heard' : 'keeper')}
      >
        <Star fill="currentColor" />
      </button>
      {onDelete && (
        <button
          type="button"
          className="status-buttons-delete"
          data-tooltip={deleteLabel ?? 'delete'}
          aria-label={deleteLabel ?? 'delete'}
          onClick={onDelete}
        >
          <Trash2 />
        </button>
      )}
    </span>
  );
}
