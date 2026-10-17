// One song, opened: for now its facts and its tracks with the clips each block plays. The editor
// (timeline, playback, prompts) is built on this page next.
import { formatMeter } from '../format.ts';
import { PlayButton } from '../player/PlayButton.tsx';
import { useSong } from '../queries/songs.ts';
import { getClipLabel } from '../clips/ClipsPage.tsx';
import { usePageTitle } from '../use-page-title.ts';
import './SongPage.css';

type SongPageProps = { songId: string };

/** The song page. */
export function SongPage({ songId }: SongPageProps) {
  const { data: detail, error } = useSong(songId);
  usePageTitle(detail?.song.title ?? songId);
  if (error) return <p className="error">{error.message}</p>;
  if (!detail) return <p className="empty">Loading…</p>;
  const { song, clips, isWaitingForAudio } = detail;
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  return (
    <section className="song-page">
      <div className="song-head">
        <PlayButton songId={song.id} isWaitingForAudio={isWaitingForAudio} />
        <h1 className="song-title">{song.title}</h1>
      </div>
      <p className="song-facts">
        {Math.round(song.bpm)} bpm · {formatMeter(song.beats)} · {song.tracks.length}{' '}
        {song.tracks.length === 1 ? 'track' : 'tracks'}
      </p>
      <ul className="track-list">
        {song.tracks.map((track) => (
          <li key={track.id} className="track-row">
            <span className="track-name">{track.name}</span>
            <span className="track-blocks">
              {track.blocks.map((block) => {
                const clip = clipsById.get(block.clip);
                return (
                  <span key={`${block.clip}-${block.start}`} className="block-chip">
                    {clip ? getClipLabel(clip) : `missing ${block.clip}`}
                  </span>
                );
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
