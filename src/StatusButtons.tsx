// The two buttons that set a song's or a clip's status: ★ keeps it, ✕ rejects it; pressed again,
// either goes back to heard.
import type { Status } from '../shared/catalogue.types.ts';

type StatusButtonsProps = { status: Status; onChange: (status: Status) => void };

/** ★ and ✕ for a status. */
export function StatusButtons({ status, onChange }: StatusButtonsProps) {
  return (
    <span className="status-buttons">
      <button
        type="button"
        className={`status-keep${status === 'keeper' ? ' is-on' : ''}`}
        title={status === 'keeper' ? 'kept; press to undo' : 'keep'}
        onClick={() => onChange(status === 'keeper' ? 'heard' : 'keeper')}
      >
        {status === 'keeper' ? '★' : '☆'}
      </button>
      <button
        type="button"
        className={`status-reject${status === 'rejected' ? ' is-on' : ''}`}
        title={status === 'rejected' ? 'rejected; press to undo' : 'reject'}
        onClick={() => onChange(status === 'rejected' ? 'heard' : 'rejected')}
      >
        ✕
      </button>
    </span>
  );
}
