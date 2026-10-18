// A section of the selection's details, as a card: what kind of thing it is (block, clip, track) in a
// small label over its title, then its content. It knows nothing of what it holds.
import type { ReactNode } from 'react';
import './DetailsSection.css';

type DetailsSectionProps = {
  kind: string;
  title: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
};

/**
 * Shows a section of the selection's details.
 *
 * @param props - The component's props.
 * @param props.kind - What the section is about, in a word: "block", "clip", "track".
 * @param props.title - Its title: the thing's name, or where it is.
 * @param props.aside - What stands at the right of the title, if anything (a button).
 * @param props.children - The section's content.
 * @returns The section element.
 */
export function DetailsSection({ kind, title, aside, children }: DetailsSectionProps) {
  return (
    <section className="details-section" aria-label={kind}>
      <header className="details-section-head">
        <div className="details-section-name">
          <span className="details-section-kind">{kind}</span>
          <h2 className="details-section-title">{title}</h2>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
