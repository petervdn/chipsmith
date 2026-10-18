// The page's own modal dialog, in place of the browser's: a card in the middle of the page over a
// see-through black backdrop while it is open; Escape or a tap beside it closes it. It knows nothing
// of what it holds.
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import './Dialog.css';

type DialogProps = {
  isOpen: boolean;
  labelId: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
};

/**
 * Shows a modal dialog while it is open.
 *
 * @param props - The component's props.
 * @param props.isOpen - Whether it is shown.
 * @param props.labelId - The id of the element in it that names it.
 * @param props.onClose - Called when Escape is pressed or the backdrop is tapped.
 * @param props.className - A class of its own, for its width or look.
 * @param props.children - What it holds.
 * @returns The dialog's element (closed when it is not open).
 */
export function Dialog({ isOpen, labelId, onClose, className, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);
  return (
    <dialog
      ref={dialogRef}
      className={`dialog${className ? ` ${className}` : ''}`}
      aria-labelledby={labelId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {isOpen && children}
    </dialog>
  );
}
