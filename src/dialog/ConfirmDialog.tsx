// The page's own confirm dialog, in place of the browser's: the question asked through
// stores/confirm-store.ts, in the page's dialog (Dialog.tsx), with Cancel (or the refusal asked
// for) and the answer. Escape, a tap beside it or Cancel says no. It knows nothing of what is asked or why.
import { useConfirmStore } from '../stores/confirm-store.ts';
import { Dialog } from './Dialog.tsx';
import './ConfirmDialog.css';

/**
 * Shows the question asked, while there is one.
 *
 * @returns The dialog's element (closed when nothing is asked).
 */
export function ConfirmDialog() {
  const asked = useConfirmStore((state) => state.asked);
  const answerQuestion = useConfirmStore((state) => state.answerQuestion);
  return (
    <Dialog
      isOpen={asked !== null}
      labelId="confirm-dialog-question"
      onClose={() => answerQuestion(false)}
    >
      {asked && (
        <div className="dialog-body">
          <p id="confirm-dialog-question" className="confirm-dialog-question">
            {asked.question}
          </p>
          <div className="dialog-buttons">
            <button type="button" className="dialog-button" onClick={() => answerQuestion(false)}>
              {asked.refusal ?? 'Cancel'}
            </button>
            <button
              type="button"
              className={`dialog-button is-yes${asked.isDanger ? ' is-danger' : ''}`}
              onClick={() => answerQuestion(true)}
              autoFocus
            >
              {asked.answer}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
