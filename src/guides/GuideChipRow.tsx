// The style guides as a row of chips that wrap, a chosen one inverted, its text's start in its
// tooltip; or "None yet." when there are none. It knows nothing of the panel or prompt around it.
import type { Guide } from '../../shared/guide.schema.ts';
import '../lists/lists.css';
import './GuideChipRow.css';

type GuideChipRowProps = {
  guides: Guide[];
  chosenIds: string[];
  onToggle: (guideId: string) => void;
};

/**
 * Shows the style guides as chips to choose.
 *
 * @param props - The component's props.
 * @param props.guides - Every style guide.
 * @param props.chosenIds - The ids of the guides chosen to go along with the prompt.
 * @param props.onToggle - Called with a guide's id when its chip is tapped.
 * @returns The row of chips, or a line saying there are none.
 */
export function GuideChipRow({ guides, chosenIds, onToggle }: GuideChipRowProps) {
  if (guides.length === 0) return <p className="guide-chip-row-none">None yet.</p>;
  return (
    <div className="guide-chip-row">
      {guides.map((guide) => (
        <button
          key={guide.id}
          type="button"
          className={`list-chip guide-chip-row-chip${chosenIds.includes(guide.id) ? ' is-on' : ''}`}
          onClick={() => onToggle(guide.id)}
          aria-pressed={chosenIds.includes(guide.id)}
          data-tooltip={guide.text.slice(0, 200)}
        >
          {guide.name}
        </button>
      ))}
    </div>
  );
}
