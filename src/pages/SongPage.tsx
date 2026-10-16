// One song, opened: for now its facts and its tracks with the clips each block plays. The editor
// (timeline, playback, prompts) is built on this page next.
import { useEffect } from 'react';
import type { SongDetail } from '../../shared/api.types.ts';
import { formatMeter } from '../format.ts';
import { PlayButton } from '../PlayButton.tsx';
import { useServerData } from '../server-api.ts';
import { getClipLabel } from './ClipsPage.tsx';

type SongPageProps = { songId: string; onTitle: (title: string | null) => void };

/** The song page. */
export function SongPage({ songId, onTitle }: SongPageProps) {
  const { data: detail, error } = useServerData<SongDetail>(
    `/api/songs/${encodeURIComponent(songId)}`,
  );
  const title = detail?.song.title ?? null;
  useEffect(() => onTitle(title), [title, onTitle]);
  if (error) return <p className="error">{error}</p>;
  if (!detail) return <p className="empty">Loading…</p>;
  const { song, clips } = detail;
  const clipsById = new Map(clips.map((clip) => [clip.id, clip]));
  return (
    <section className="song-page">
      <div className="song-head">
        <PlayButton songId={song.id} />
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
