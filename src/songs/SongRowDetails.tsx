// What a song's row shows when it is opened: the prompt the song was made from (and the names of the
// style guides sent with it), with a copy button,
// links to prompt it again or to use the song as the base of a new prompt, and a warning when the
// song has changed since; the song's facts; and the songs it was prompted from or prompted again as.
import { useState } from 'react';
import type { SongListing } from '../../shared/api.types.ts';
import { copyText } from '../copy-text.ts';
import '../lists/lists.css';
import './SongRowDetails.css';

type SongRowDetailsProps = { listing: SongListing; titlesById: Map<string, string> };

/**
 * Shows the details of a song's opened row: its prompt with copy, prompt again and use as base, its
 * facts, and the songs it was prompted from or prompted again as.
 *
 * @param props - The component's props.
 * @param props.listing - The song's listing.
 * @param props.titlesById - Every song's title by its id, for the links to other songs.
 * @returns The details' element.
 */
export function SongRowDetails({ listing, titlesById }: SongRowDetailsProps) {
  const { song, isChangedAfterPrompt, key, chips, clipCount, promptedAgainAs } = listing;
  const [copyResult, setCopyResult] = useState<boolean | null>(null);
  function getSongLink(songId: string) {
    return (
      <a key={songId} href={`/songs/${encodeURIComponent(songId)}`}>
        {titlesById.get(songId) ?? songId}
      </a>
    );
  }
  const facts = [
    key,
    chips.join(' + '),
    `${song.tracks.length} ${song.tracks.length === 1 ? 'track' : 'tracks'}`,
    `${clipCount} ${clipCount === 1 ? 'clip' : 'clips'}`,
    `made ${formatDate(song.created)}`,
    song.updated !== song.created ? `changed ${formatDate(song.updated)}` : null,
    song.id,
  ].filter(Boolean);

  return (
    <div className="song-row-details">
      <div className="song-row-details-prompt">
        <p className="song-row-details-prompt-text">{song.prompt}</p>
        {isChangedAfterPrompt && (
          <p className="list-warning">
            ⚠ Changed after this prompt: some of its clips were made by later prompts.
          </p>
        )}
        <div className="song-row-details-prompt-actions">
          <button
            type="button"
            className="list-action"
            onClick={() => void copyText(song.prompt).then(setCopyResult)}
            title="copy the prompt"
          >
            {copyResult === null
              ? 'Copy'
              : copyResult
                ? 'Copied ✓'
                : 'Could not copy: select the text'}
          </button>
          <a
            className="list-action"
            href={`/new?from=${encodeURIComponent(song.id)}`}
            title="open New with this prompt, to send it again (the new songs note this one)"
          >
            Prompt again →
          </a>
          <a
            className="list-action"
            href={`/new?base=${encodeURIComponent(song.id)}`}
            title="open New with this song as the base: Claude starts from its music and changes what you ask"
          >
            Use as base →
          </a>
        </div>
      </div>
      <p className="song-row-details-facts">{facts.join(' · ')}</p>
      {song.guides.length > 0 && (
        <p className="song-row-details-facts">
          style guides: {song.guides.map((guide) => guide.name).join(', ')}
        </p>
      )}
      {song.tags.length > 0 && (
        <p className="song-row-details-facts">
          tags: {song.tags.map((tag) => tag.name).join(', ')}
        </p>
      )}
      {song.promptedFrom && (
        <p className="song-row-details-facts">
          Prompted again from {getSongLink(song.promptedFrom)}
        </p>
      )}
      {promptedAgainAs.length > 0 && (
        <p className="song-row-details-facts">
          Prompted again as{' '}
          {promptedAgainAs.map((songId, i) => (
            <span key={songId}>
              {i > 0 && ', '}
              {getSongLink(songId)}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/**
 * Returns a date as day, month and time, such as "16 Oct 22:09".
 *
 * @param iso - The date, in ISO form.
 * @returns The date as it is shown, or the text as given when it is not a date.
 */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}
