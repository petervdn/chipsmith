// What a song's row shows when it is opened: the prompt the song was made from, with a copy button,
// a link that prompts it again and a warning when the song has changed since; the song's facts; and
// the songs it was prompted from or prompted again as.
import { useState } from 'react';
import type { SongListing } from '../shared/api.types.ts';
import { copyText } from './copy-text.ts';

type SongRowDetailsProps = { listing: SongListing; titlesById: Map<string, string> };

/** The details of a song's row. */
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
    <div className="row-details">
      <div className="row-prompt">
        <p className="row-prompt-text">{song.prompt}</p>
        {isChangedAfterPrompt && (
          <p className="row-warning">
            ⚠ Changed after this prompt: some of its clips were made by later prompts.
          </p>
        )}
        <div className="row-prompt-actions">
          <button
            type="button"
            className="row-action"
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
            className="row-action"
            href={`/new?from=${encodeURIComponent(song.id)}`}
            title="open New with this prompt, to send it again (the new songs note this one)"
          >
            Prompt again →
          </a>
        </div>
      </div>
      <p className="row-facts">{facts.join(' · ')}</p>
      {song.tags.length > 0 && (
        <p className="row-facts">tags: {song.tags.map((tag) => tag.name).join(', ')}</p>
      )}
      {song.promptedFrom && (
        <p className="row-facts">Prompted again from {getSongLink(song.promptedFrom)}</p>
      )}
      {promptedAgainAs.length > 0 && (
        <p className="row-facts">
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

/** "16 Oct 22:09" for an ISO date. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}
