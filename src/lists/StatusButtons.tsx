// The two buttons that set a song's or a clip's status: ★ keeps it, a quiet ✕ rejects it (which hides it
// from the list until "rejected" is ticked); pressed again, either goes back to heard.
import { Star, X } from 'lucide-react';
import type { Status } from '../../shared/catalogue.types.ts';
import './StatusButtons.css';

type StatusButtonsProps = { status: Status; onChange: (status: Status) => void };

/**
 * Shows ★ and ✕ for a status: each sets its status, and pressed again goes back to heard.
 *
 * @param props - The component's props.
 * @param props.status - The status shown.
 * @param props.onChange - Called with the status chosen.
 * @returns The buttons' element.
 */
export function StatusButtons({ status, onChange }: StatusButtonsProps) {
  return (
    <span className="status-buttons">
      <button
        type="button"
        className={`status-buttons-keep${status === 'keeper' ? ' is-on' : ''}`}
        data-tooltip={status === 'keeper' ? 'kept; press to undo' : 'keep'}
        aria-label={status === 'keeper' ? 'kept; press to undo' : 'keep'}
        onClick={() => onChange(status === 'keeper' ? 'heard' : 'keeper')}
      >
        <Star fill={status === 'keeper' ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        className={`status-buttons-reject${status === 'rejected' ? ' is-on' : ''}`}
        data-tooltip={
          status === 'rejected'
            ? 'rejected; press to take it back'
            : 'reject (hides it from the list)'
        }
        aria-label={
          status === 'rejected'
            ? 'rejected; press to take it back'
            : 'reject (hides it from the list)'
        }
        onClick={() => onChange(status === 'rejected' ? 'heard' : 'rejected')}
      >
        <X />
      </button>
    </span>
  );
}
