// The style guides as chips under the prompt box, in a panel like the New page's others (FoldPanel):
// the chips always shown, a chosen one sent along with the prompt, copied (docs/adr/0019); ▸ opens
// under them a line saying what they do, each guide's text to read without leaving the prompt, and
// a link to the Guides page to make or change them.
import { useState } from 'react';
import type { Guide } from '../../shared/guide.types.ts';
import { FoldPanel } from '../new-song/FoldPanel.tsx';
import '../lists/lists.css';
import './GuideChips.css';

type GuideChipsProps = {
  guides: Guide[];
  chosenIds: string[];
  onToggle: (guideId: string) => void;
};

/**
 * Shows the style guides as chips to choose for a prompt, the text of each to read, and a link
 * to the Guides page.
 *
 * @param props - The component's props.
 * @param props.guides - Every style guide.
 * @param props.chosenIds - The ids of the guides chosen to go along with the prompt.
 * @param props.onToggle - Called with a guide's id when its chip is tapped.
 * @returns The guides' panel.
 */
export function GuideChips({ guides, chosenIds, onToggle }: GuideChipsProps) {
  const [isOpen, setOpen] = useState(false);
  return (
    <FoldPanel
      label="Style guides"
      summary={
        guides.length === 0 ? (
          <p className="guide-chips-none">None yet.</p>
        ) : (
          <div className="guide-chips-row">
            {guides.map((guide) => (
              <button
                key={guide.id}
                type="button"
                className={`list-chip guide-chips-chip${chosenIds.includes(guide.id) ? ' is-on' : ''}`}
                onClick={() => onToggle(guide.id)}
                aria-pressed={chosenIds.includes(guide.id)}
                data-tooltip={guide.text.slice(0, 200)}
              >
                {guide.name}
              </button>
            ))}
          </div>
        )
      }
      isOpen={isOpen}
      onToggle={() => setOpen(!isOpen)}
      toggleLabels={{ open: "hide the guides' texts", closed: 'read what the guides say' }}
    >
      <p className="guide-chips-help">
        {guides.length === 0
          ? 'A style guide tells Claude your taste, and goes along with a prompt.'
          : 'Tap the guides to send along with this prompt: they tell Claude your taste. The highlighted ones go with it.'}
      </p>
      {guides.map((guide) => (
        <details key={guide.id} className="guide-chips-read">
          <summary>
            {guide.name}
            {chosenIds.includes(guide.id) && (
              <span className="guide-chips-read-chosen"> · goes along</span>
            )}
          </summary>
          <p className="guide-chips-read-text">{guide.text}</p>
        </details>
      ))}
      <a className="guide-chips-edit" href="/guides">
        {guides.length === 0 ? 'Make a style guide →' : 'Make or change guides →'}
      </a>
    </FoldPanel>
  );
}
