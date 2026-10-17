// One song, opened: its title and facts, the prompt it was made from, and the editor
// (editor/SongEditor.tsx).
import { formatMeter } from '../format.ts';
import { SongEditor } from '../editor/SongEditor.tsx';
import { useSong } from '../queries/songs.ts';
import { usePageTitle } from '../use-page-title.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { SongPrompt } from './SongPrompt.tsx';
import './SongPage.css';

type SongPageProps = { songId: string };

/**
 * Shows the song page: the song's title and facts, its prompt, and the editor.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song opened.
 * @returns The page's section element, or a paragraph while it loads or when it could not be read.
 */
export function SongPage({ songId }: SongPageProps) {
  const { data: detail, error } = useSong(songId);
  usePageTitle(detail?.song.title ?? songId);
  if (error) return <p className="error">{error.message}</p>;
  if (!detail) return <p className="empty">Loading…</p>;
  const { song } = detail;
  return (
    <section className="song-page">
      <Breadcrumbs crumbs={[{ label: 'Songs', href: '/songs' }, { label: song.title }]} />
      <p className="song-page-facts">
        {Math.round(song.bpm)} bpm · {formatMeter(song.beats)} · {song.tracks.length}{' '}
        {song.tracks.length === 1 ? 'track' : 'tracks'}
      </p>
      <SongPrompt prompt={song.prompt} />
      <SongEditor key={song.updated} detail={detail} />
    </section>
  );
}
