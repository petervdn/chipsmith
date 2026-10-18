// A panel of the New page (the prompt builder, the structure, the style guides): a card with its
// name in its border, what is chosen always shown, buttons beside it if any, and ▸ at the right,
// which opens what changes it underneath; what was shown stays where it is. It knows nothing of
// what is in it.
import { ChevronRight } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import './FoldPanel.css';

type FoldPanelProps = {
  label: string;
  summary: ReactNode;
  actions?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  toggleLabels: { open: string; closed: string };
  children: ReactNode;
  panelRef?: Ref<HTMLFieldSetElement>;
};

/**
 * Shows a panel: its name, its summary, its buttons and ▸, and its body while open.
 *
 * @param props - The component's props.
 * @param props.label - What the panel is, in its border ("Structure").
 * @param props.summary - What is chosen, always shown.
 * @param props.actions - Buttons at the summary's right, before ▸; none if left out.
 * @param props.isOpen - Whether the body shows.
 * @param props.onToggle - Called when ▸ is pressed.
 * @param props.toggleLabels - What ▸ does: closing the body (while open), opening it (while closed).
 * @param props.children - The body: what changes what is chosen.
 * @param props.panelRef - Given the panel's element, for a press outside it; none if left out.
 * @returns The panel's fieldset element.
 */
export function FoldPanel({
  label,
  summary,
  actions,
  isOpen,
  onToggle,
  toggleLabels,
  children,
  panelRef,
}: FoldPanelProps) {
  const toggleLabel = isOpen ? toggleLabels.open : toggleLabels.closed;
  return (
    <fieldset ref={panelRef} className={`fold-panel${isOpen ? ' is-open' : ''}`}>
      <legend className="fold-panel-label">{label}</legend>
      <div className="fold-panel-top">
        <div className="fold-panel-summary">{summary}</div>
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
    </fieldset>
  );
}
