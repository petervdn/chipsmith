// One song, opened: its title alone (no Songs › before it) with ★ to keep it and, at the right, the
// place the editor puts Revert and Save in; its header (its facts, the prompt it was made from and
// what that was sent with), and the editor (editor/SongEditor.tsx), with nothing but the song itself
// playing when it opens.
import { useState } from 'react';
import { SongEditor } from '../editor/SongEditor.tsx';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { useSetSongStatus, useSong } from '../queries/songs.ts';
import { usePageTitle } from '../use-page-title.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { SongHeader } from './header/SongHeader.tsx';
import { getSongSummary } from './header/song-summary.ts';
import { useStopOnOpen } from './use-stop-on-open.ts';
import './SongPage.css';

type SongPageProps = { songId: string };

/**
 * Shows the song page: the song's title with ★, its header, and the editor.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song opened.
 * @returns The page's section element, or a paragraph while it loads or when it could not be read.
 */
export function SongPage({ songId }: SongPageProps) {
  const [saveSlot, setSaveSlot] = useState<HTMLDivElement | null>(null);
  const { data: detail, error } = useSong(songId);
  const { mutate: setStatus } = useSetSongStatus();
  useStopOnOpen(songId);
  usePageTitle(detail?.song.title ?? songId);
  if (error) return <p className="error">{error.message}</p>;
  if (!detail) return <p className="empty">Loading…</p>;
  const { song } = detail;
  return (
    <section className="song-page">
      <div className="song-page-head">
        <Breadcrumbs crumbs={[{ label: song.title }]} />
        <StatusButtons
          status={song.status}
          onChange={(status) => setStatus({ songId: song.id, status })}
        />
        <div ref={setSaveSlot} className="song-page-save" />
      </div>
      <SongHeader summary={getSongSummary(song, detail.clips)} />
      {/* other tracks from the server (split, one added or removed) start the editor afresh; a new
          arrangement of the same tracks is taken in by its draft (editor/use-song-draft.ts) */}
      <SongEditor
        key={[song.id, ...song.tracks.map((track) => track.id)].join(' ')}
        detail={detail}
        saveSlot={saveSlot}
      />
    </section>
  );
}
