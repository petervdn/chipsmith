// The style guides as chips under the prompt box, in a panel of their own with a line saying what
// they do: a chosen one is sent along with the prompt, copied (docs/adr/0019). Each guide's text can
// be read here, opened under the chips, without leaving the prompt; a link opens the Guides page to
// make or change them.
import type { Guide } from '../../shared/guide.types.ts';
import '../lists/lists.css';
import './GuideChips.css';

type GuideChipsProps = {
  guides: Guide[];
  chosenIds: string[];
  onToggle: (guideId: string) => void;
};

/** The guide chips. */
export function GuideChips({ guides, chosenIds, onToggle }: GuideChipsProps) {
  return (
    <fieldset className="guide-chips">
      <legend className="guide-chips-label">Style guides</legend>
      <p className="guide-chips-help">
        {guides.length === 0
          ? 'A style guide tells Claude your taste, and goes along with a prompt. There are none yet.'
          : 'Tap the guides to send along with this prompt: they tell Claude your taste. The highlighted ones go with it.'}
      </p>
      {guides.length > 0 && (
        <div className="guide-chips-row">
          {guides.map((guide) => (
            <button
              key={guide.id}
              type="button"
              className={`tag-chip guide-chip${chosenIds.includes(guide.id) ? ' is-on' : ''}`}
              onClick={() => onToggle(guide.id)}
              aria-pressed={chosenIds.includes(guide.id)}
              title={guide.text.slice(0, 200)}
            >
              {guide.name}
            </button>
          ))}
        </div>
      )}
      {guides.length > 0 && (
        <details className="guide-texts">
          <summary>Read what the guides say</summary>
          {guides.map((guide) => (
            <details key={guide.id} className="guide-read">
              <summary>
                {guide.name}
                {chosenIds.includes(guide.id) && (
                  <span className="guide-read-chosen"> · goes along</span>
                )}
              </summary>
              <p className="guide-read-text">{guide.text}</p>
            </details>
          ))}
        </details>
      )}
      <a className="guide-chips-edit" href="/guides">
        {guides.length === 0 ? 'Make a style guide →' : 'Make or change guides →'}
      </a>
    </fieldset>
  );
}
