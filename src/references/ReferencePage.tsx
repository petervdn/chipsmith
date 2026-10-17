// One reference: its name, author, chips and length, ▶ for its mix and for each channel alone, and
// a box for what the user hears in it, written as they type (use-reference-notes.ts).
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { formatSeconds } from '../format.ts';
import type { ReferenceListing } from '../../shared/api.types.ts';
import { useReferences } from '../queries/references.ts';
import { getReferenceAudioUrl } from '../stores/player-store.ts';
import { usePageTitle } from '../use-page-title.ts';
import { getChipLine } from './reference-groups.ts';
import { ReferencePlayButton } from './ReferencePlayButton.tsx';
import { useReferenceNotes } from './use-reference-notes.ts';
import type { NotesState } from './use-reference-notes.ts';
import '../lists/lists.css';
import './references.css';

type ReferencePageProps = { referenceId: string };

/** What the box says of its notes, by whether they are written. */
const NOTES_STATES = {
  saved: 'saved',
  saving: 'saving…',
  unsaved: '',
  failed: 'not saved: the server did not take it',
} satisfies Record<NotesState, string>;

/**
 * Shows a reference's page.
 *
 * @param props - The component's props.
 * @param props.referenceId - The reference's id.
 * @returns The page's section element.
 */
export function ReferencePage({ referenceId }: ReferencePageProps) {
  const { data: listings, error } = useReferences();
  const listing = listings?.find((candidate) => candidate.reference.id === referenceId);
  usePageTitle(listing?.name ?? 'Reference');
  return (
    <section className="references-page">
      <Breadcrumbs
        crumbs={[{ label: 'References', href: '/references' }, { label: listing?.name ?? '…' }]}
      />
      {error && <p className="error">{error.message}</p>}
      {listings && !listing && <p className="empty">No reference {referenceId}.</p>}
      {listing && <ReferenceDetails listing={listing} />}
    </section>
  );
}

type ReferenceDetailsProps = { listing: ReferenceListing };

/**
 * Shows what a reference's page holds: its facts, its audio and the notes box.
 *
 * @param props - The component's props.
 * @param props.listing - The reference.
 * @returns The details' element.
 */
function ReferenceDetails({ listing }: ReferenceDetailsProps) {
  const { reference, name, author, album, channels, subsongCount, seconds } = listing;
  const { notes, state, change, saveNow } = useReferenceNotes(reference.id, reference.notes);
  const facts = [
    author,
    album,
    getChipLine(listing),
    seconds ? formatSeconds(seconds) : '',
    subsongCount > 1 ? `the first of ${subsongCount} subsongs` : '',
  ].filter(Boolean);
  return (
    <>
      <p className="references-facts">{facts.join(' · ')}</p>
      <label className="references-notes">
        <span className="references-notes-head">
          What you hear in it
          <span className="references-notes-state">{NOTES_STATES[state]}</span>
        </span>
        <textarea
          value={notes}
          onChange={(event) => change(event.target.value)}
          onBlur={saveNow}
          rows={6}
          placeholder="What you like or not, and where: a channel, a moment (0:40), a sound, a trick."
        />
      </label>
      {seconds ? (
        <ul className="list references-audio">
          {[null, ...channels.map((_unused, i) => i + 1)].map((channel) => {
            const label = channel === null ? 'All channels' : (channels[channel - 1] ?? '');
            return (
              <li key={channel ?? 'mix'}>
                <div className="list-row has-play">
                  <ReferencePlayButton
                    play={{
                      referenceId: reference.id,
                      channel,
                      title: channel === null ? name : `${name}: ${label}`,
                      url: getReferenceAudioUrl(reference.id, channel),
                      seconds,
                    }}
                    label={label}
                  />
                  <span className="list-main">
                    <span className="list-title">{label}</span>
                  </span>
                  <span className="list-facts">
                    <span>{channel === null ? 'the mix' : `channel ${channel}`}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">Its audio is not there: import it again.</p>
      )}
      <p className="references-file">{reference.file}</p>
    </>
  );
}
