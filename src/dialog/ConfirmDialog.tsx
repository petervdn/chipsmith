// The page's own confirm dialog, in place of the browser's: the question asked through
// stores/confirm-store.ts over a see-through black backdrop, with Cancel and the answer. Escape, a
// tap beside it or Cancel says no. It knows nothing of what is asked or why.
import { useEffect, useRef } from 'react';
import { useConfirmStore } from '../stores/confirm-store.ts';
import './ConfirmDialog.css';

/**
 * Shows the question asked, while there is one.
 *
 * @returns The dialog's element (closed when nothing is asked).
 */
export function ConfirmDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const asked = useConfirmStore((state) => state.asked);
  const answerQuestion = useConfirmStore((state) => state.answerQuestion);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (asked && !dialog.open) dialog.showModal();
    if (!asked && dialog.open) dialog.close();
  }, [asked]);
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-question"
      onCancel={(event) => {
        event.preventDefault();
        answerQuestion(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) answerQuestion(false);
      }}
    >
      {asked && (
        <div className="confirm-dialog-body">
          <p id="confirm-dialog-question" className="confirm-dialog-question">
            {asked.question}
          </p>
          <div className="confirm-dialog-buttons">
            <button
              type="button"
              className="confirm-dialog-button"
              onClick={() => answerQuestion(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`confirm-dialog-button is-yes${asked.isDanger ? ' is-danger' : ''}`}
              onClick={() => answerQuestion(true)}
              autoFocus
            >
              {asked.answer}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
