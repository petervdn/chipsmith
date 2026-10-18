// Facts with their labels, as a list of terms: a grid (the label over its value, in columns) or
// rows (a table, the label at the left). It knows nothing of what the facts are.
import type { SongFact } from './song-summary.ts';
import './FactList.css';

/** How the facts are laid out. */
export type FactListLook = 'grid' | 'rows';

type FactListProps = { facts: SongFact[]; look: FactListLook };

/**
 * Shows facts with their labels.
 *
 * @param props - The component's props.
 * @param props.facts - The facts, in the order shown.
 * @param props.look - How they are laid out.
 * @returns The list's element, or null when there are no facts.
 */
export function FactList({ facts, look }: FactListProps) {
  if (facts.length === 0) return null;
  return (
    <dl className={`fact-list is-${look}`}>
      {facts.map(({ label, value }) => (
        <div key={label} className="fact-list-fact">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
