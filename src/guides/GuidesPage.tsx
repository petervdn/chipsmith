// The Guides page: the style guides, each with its name, whether it is chosen by default and the
// start of its text; tapping one opens it to edit, "New style guide" makes one. A guide is sent along
// with a prompt when its chip is chosen on New, and copied then (docs/adr/0019).
import { useState } from 'react';
import { GuideEditor } from './GuideEditor.tsx';
import { useGuides } from '../queries/guides.ts';
import { usePageTitle } from '../use-page-title.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import '../lists/lists.css';
import './guides.css';
import './GuidesPage.css';

/** What is open: a guide by id, a new one, or nothing. */
type OpenGuide = { guideId: string } | 'new' | null;

/**
 * Shows the Guides page: the style guides, one of them or a new one open to edit.
 *
 * @returns The page's section element.
 */
export function GuidesPage() {
  const [open, setOpen] = useState<OpenGuide>(null);
  const { data: guides, error } = useGuides();
  usePageTitle('Guides');
  return (
    <section className="guides-page">
      <Breadcrumbs crumbs={[{ label: 'Guides' }]} />
      <p className="guides-page-intro">
        Style guides are sent along with a prompt when you choose them on New. What was sent is kept
        with the songs it made, so changing a guide changes only what comes after.
      </p>
      {open === 'new' ? (
        <GuideEditor guide={null} onDone={() => setOpen(null)} />
      ) : (
        <button type="button" className="guides-new" onClick={() => setOpen('new')}>
          New style guide
        </button>
      )}
      {error && <p className="error">{error.message}</p>}
      {guides && guides.length === 0 && open !== 'new' && (
        <p className="empty">No style guides yet.</p>
      )}
      <ul className="list">
        {(guides ?? []).map((guide) => (
          <li key={guide.id}>
            {open !== 'new' && open?.guideId === guide.id ? (
              <GuideEditor key={guide.updated} guide={guide} onDone={() => setOpen(null)} />
            ) : (
              <button
                type="button"
                className="guides-page-row"
                onClick={() => setOpen({ guideId: guide.id })}
                title="edit this style guide"
              >
                <span className="list-title">{guide.name}</span>
                {guide.isDefault && (
                  <span className="guides-page-default">preselected by default</span>
                )}
                <span className="guides-page-preview">{guide.text}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
