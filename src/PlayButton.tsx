// ▶ for one song in a list or on its page: loads the song when pressed and plays it from the start,
// or stops it when it is the one playing.
import type { SongDetail } from '../shared/api.types.ts';
import { getSongPosition } from './playback/audio-engine.ts';
import { playSong, stopSong, usePlayer } from './playback/player.ts';

type PlayButtonProps = { songId: string };

/** The play button of a song. */
export function PlayButton({ songId }: PlayButtonProps) {
  const player = usePlayer();
  const isThisSong = player.song?.song.id === songId && player.mode !== 'stopped';

  async function toggle(): Promise<void> {
    if (isThisSong) {
      stopSong(getSongPosition() ?? 0);
      return;
    }
    const response = await fetch(`/api/songs/${encodeURIComponent(songId)}`);
    const detail: SongDetail = await response.json();
    await playSong(detail);
  }

  return (
    <button
      type="button"
      className="play-button"
      onClick={() => void toggle()}
      title={isThisSong ? 'stop' : 'play'}
    >
      {isThisSong ? (player.mode === 'loading' ? `${Math.round(player.loaded * 100)}%` : '■') : '▶'}
    </button>
  );
}
