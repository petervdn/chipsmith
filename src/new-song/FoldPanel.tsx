// A panel of the New page (the prompt builder, the structure, the style guides): a card with a small
// heading and what is chosen, always shown, buttons beside it if any, and ▸ at the right, which
// opens what changes it underneath; what was shown stays where it is. It knows nothing of what is
// in it.
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import './FoldPanel.css';

type FoldPanelProps = {
  heading: ReactNode;
  summary: ReactNode;
  actions?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  toggleLabels: { open: string; closed: string };
  children: ReactNode;
};

/**
 * Shows a panel: its heading and summary, its buttons and ▸, and its body while open.
 *
 * @param props - The component's props.
 * @param props.heading - What the panel is, small, above the summary.
 * @param props.summary - What is chosen, always shown.
 * @param props.actions - Buttons at the summary's right, before ▸; none if left out.
 * @param props.isOpen - Whether the body shows.
 * @param props.onToggle - Called when ▸ is pressed.
 * @param props.toggleLabels - What ▸ does: closing the body (while open), opening it (while closed).
 * @param props.children - The body: what changes what is chosen.
 * @returns The panel's section element.
 */
export function FoldPanel({
  heading,
  summary,
  actions,
  isOpen,
  onToggle,
  toggleLabels,
  children,
}: FoldPanelProps) {
  const toggleLabel = isOpen ? toggleLabels.open : toggleLabels.closed;
  return (
    <section className={`fold-panel${isOpen ? ' is-open' : ''}`}>
      <div className="fold-panel-top">
        <div className="fold-panel-summary">
          <span className="fold-panel-heading">{heading}</span>
          {summary}
        </div>
        <div className="fold-panel-actions">
          {actions}
          <button
            type="button"
            className="fold-panel-toggle"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={toggleLabel}
            data-tooltip={toggleLabel}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      {isOpen && <div className="fold-panel-body">{children}</div>}
    </section>
  );
}
