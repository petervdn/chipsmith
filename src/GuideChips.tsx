// The style guides as chips under the prompt box: a chosen one is sent along with the prompt, copied
// (docs/adr/0019). A link opens the Guides page to make or change them.
import type { Guide } from '../shared/guide.types.ts';

type GuideChipsProps = {
  guides: Guide[];
  chosenIds: string[];
  onToggle: (guideId: string) => void;
};

/** The guide chips. */
export function GuideChips({ guides, chosenIds, onToggle }: GuideChipsProps) {
  return (
    <div className="guide-chips">
      <span className="guide-chips-label">Style guides</span>
      {guides.map((guide) => (
        <button
          key={guide.id}
          type="button"
          className={`tag-chip${chosenIds.includes(guide.id) ? ' is-on' : ''}`}
          onClick={() => onToggle(guide.id)}
          aria-pressed={chosenIds.includes(guide.id)}
          title={guide.text.slice(0, 200)}
        >
          {guide.name}
        </button>
      ))}
      <a className="guide-chips-edit" href="/guides">
        {guides.length === 0 ? 'Make a style guide →' : 'Edit →'}
      </a>
    </div>
  );
}
