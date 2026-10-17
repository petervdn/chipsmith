// A bar above the player bar after a change that takes something out of sight (a reject): says what
// happened and offers to undo it, for a few seconds. `useUndo` keeps the one offer a page has.
import { useCallback, useEffect, useState } from 'react';
import './UndoBar.css';

/** How long an undo is offered, in milliseconds. */
const OFFER_TIME = 8000;

/** An offer to undo: what happened, and how to put it back. */
export type UndoOffer = { text: string; undo: () => void };

/**
 * Keeps the page's one undo offer, which goes away by itself after OFFER_TIME.
 *
 * @returns The offer, or null when there is none, and a setter for the next one (null takes it
 *   away).
 */
export function useUndo(): [UndoOffer | null, (offer: UndoOffer | null) => void] {
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  useEffect(() => {
    if (!offer) return;
    const timer = setTimeout(() => setOffer(null), OFFER_TIME);
    return () => clearTimeout(timer);
  }, [offer]);
  return [offer, useCallback((next: UndoOffer | null) => setOffer(next), [])];
}

type UndoBarProps = { offer: UndoOffer | null; onClose: () => void };

/**
 * Shows the undo bar while there is an offer.
 *
 * @param props - The component's props.
 * @param props.offer - The offer to undo, or null when there is none.
 * @param props.onClose - Called after Undo has been pressed and done.
 * @returns The undo bar's element, or null when there is no offer.
 */
export function UndoBar({ offer, onClose }: UndoBarProps) {
  if (!offer) return null;
  return (
    <div className="undo-bar" role="status">
      <span className="undo-bar-text">{offer.text}</span>
      <button
        type="button"
        className="undo-bar-button"
        onClick={() => {
          offer.undo();
          onClose();
        }}
      >
        Undo
      </button>
    </div>
  );
}
