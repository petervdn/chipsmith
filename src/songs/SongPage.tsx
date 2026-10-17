// One song, opened: its title and facts, and the editor (editor/SongEditor.tsx).
import { formatMeter } from '../format.ts';
import { SongEditor } from '../editor/SongEditor.tsx';
import { useSong } from '../queries/songs.ts';
import { usePageTitle } from '../use-page-title.ts';
import './SongPage.css';

type SongPageProps = { songId: string };

/** The song page. */
export function SongPage({ songId }: SongPageProps) {
  const { data: detail, error } = useSong(songId);
  usePageTitle(detail?.song.title ?? songId);
  if (error) return <p className="error">{error.message}</p>;
  if (!detail) return <p className="empty">Loading…</p>;
  const { song } = detail;
  return (
    <section className="song-page">
      <h1 className="song-page-title">{song.title}</h1>
      <p className="song-page-facts">
        {Math.round(song.bpm)} bpm · {formatMeter(song.beats)} · {song.tracks.length}{' '}
        {song.tracks.length === 1 ? 'track' : 'tracks'}
      </p>
      <SongEditor detail={detail} />
    </section>
  );
}
