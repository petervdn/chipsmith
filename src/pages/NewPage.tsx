// The New page: a prompt for Claude, written in a box that takes the screen; sending it leads to the
// Jobs page.
// `/new?from=<song>` starts with that song's prompt, to send it again; `/new?base=<song>` starts with
// "Based on <song> [<id>]: ", for a prompt that changes that song (notes/making-songs.md).
import { useState } from 'react';
import type { PromptSource } from '../PromptBox.tsx';
import { PromptBox } from '../PromptBox.tsx';
import { useSongs } from '../queries/songs.ts';
import { usePageTitle } from '../use-page-title.ts';

/** The New page. */
export function NewPage() {
  const [fromSongId] = useState(() => new URLSearchParams(window.location.search).get('from'));
  const [baseSongId] = useState(() => new URLSearchParams(window.location.search).get('base'));
  const [isSourceCleared, setSourceCleared] = useState(false);
  usePageTitle('New song');
  const { data: listings } = useSongs();
  const from = fromSongId ? listings?.find(({ song }) => song.id === fromSongId) : undefined;
  const base = baseSongId ? listings?.find(({ song }) => song.id === baseSongId) : undefined;
  const initialText = from
    ? from.song.prompt
    : base
      ? `Based on ${base.song.title} [${base.song.id}]: `
      : '';
  const source: PromptSource | null =
    from && !isSourceCleared
      ? {
          songId: from.song.id,
          title: from.song.title,
          isChangedAfterPrompt: from.isChangedAfterPrompt,
        }
      : null;

  function clearSource(): void {
    setSourceCleared(true);
    window.history.replaceState(null, '', '/new');
  }

  return (
    <section className="new-page">
      {(fromSongId || baseSongId) && !listings ? (
        <p className="empty">Loading the prompt…</p>
      ) : (
        <PromptBox
          key={fromSongId ?? baseSongId ?? 'new'}
          initialText={initialText}
          source={source}
          onClearSource={clearSource}
        />
      )}
    </section>
  );
}
