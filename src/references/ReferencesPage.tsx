// The References page: Furnace's demo songs, under the app's chip each plays on, each with ▶ for
// its mix, its chips and length, and a mark when notes are written in it. Opening one lists its
// channels to hear alone and the box for what is heard in it. Nothing here becomes a rule: the
// notes are the user's own words.
import { NotebookPen } from 'lucide-react';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { formatSeconds } from '../format.ts';
import { useReferences } from '../queries/references.ts';
import { getReferenceAudioUrl } from '../stores/player-store.ts';
import { usePageTitle } from '../use-page-title.ts';
import { getChipLine, getReferenceGroups } from './reference-groups.ts';
import { ReferencePlayButton } from './ReferencePlayButton.tsx';
import '../lists/lists.css';
import './references.css';

/**
 * Shows the References page.
 *
 * @returns The page's section element.
 */
export function ReferencesPage() {
  const { data: listings, error } = useReferences();
  usePageTitle('References');
  return (
    <section className="references-page">
      <Breadcrumbs crumbs={[{ label: 'References' }]} />
      <p className="references-intro">
        Furnace&apos;s demo songs, to listen to channel by channel and write down what you hear in
        them. The notes are yours: nothing here becomes a rule for the songs until you say so.
      </p>
      {error && <p className="error">{error.message}</p>}
      {listings && listings.length === 0 && (
        <p className="empty">
          No references yet: <code>npm run import-references</code> imports Furnace&apos;s demos.
        </p>
      )}
      <ul className="list">
        {getReferenceGroups(listings ?? []).map((group) => [
          <li key={group.family} className="list-group">
            {group.label}
          </li>,
          ...group.listings.map((listing) => {
            const { reference, name, seconds } = listing;
            return (
              <li key={reference.id}>
                <div className="list-row has-play">
                  {seconds ? (
                    <ReferencePlayButton
                      play={{
                        referenceId: reference.id,
                        channel: null,
                        title: name,
                        url: getReferenceAudioUrl(reference.id, null),
                        seconds,
                      }}
                      label={name}
                    />
                  ) : (
                    <span />
                  )}
                  <span className="list-main">
                    <a
                      className="list-title list-link"
                      href={`/references/${encodeURIComponent(reference.id)}`}
                    >
                      {name}
                    </a>
                    <span className="list-tags">{listing.author}</span>
                  </span>
                  <span className="list-facts">
                    {reference.notes.trim() && (
                      <span className="references-noted" data-tooltip="you wrote notes in it">
                        <NotebookPen />
                      </span>
                    )}
                    <span>{getChipLine(listing)}</span>
                    <span>{seconds ? formatSeconds(seconds) : ''}</span>
                  </span>
                </div>
              </li>
            );
          }),
        ])}
      </ul>
    </section>
  );
}
