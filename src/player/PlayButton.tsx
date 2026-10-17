// ▶ for one song in a list or on its page: loads the song when pressed and plays it from the start,
// or stops it when it is the one playing. Filled orange while its song plays; … and not pressable
// while the server renders its audio.
import { getSongPosition } from '../playback/audio-engine.ts';
import { fetchSong } from '../queries/songs.ts';
import { usePlayerStore } from '../stores/player-store.ts';

type PlayButtonProps = { songId: string; isWaitingForAudio: boolean };

/** The play button of a song. */
export function PlayButton({ songId, isWaitingForAudio }: PlayButtonProps) {
  const isThisSong = usePlayerStore(
    (player) => player.song?.song.id === songId && player.mode !== 'stopped',
  );
  const loadedPercent = usePlayerStore((player) =>
    player.song?.song.id === songId && player.mode === 'loading'
      ? Math.round(player.loaded * 100)
      : null,
  );
  const playSong = usePlayerStore((player) => player.playSong);
  const stopSong = usePlayerStore((player) => player.stopSong);

  async function toggle(): Promise<void> {
    if (isThisSong) {
      stopSong(getSongPosition() ?? 0);
      return;
    }
    await playSong(await fetchSong(songId));
  }

  if (isWaitingForAudio) {
    return (
      <button type="button" className="play-button" disabled title="its audio is being rendered">
        …
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`play-button${isThisSong ? ' is-playing' : ''}`}
      onClick={() => void toggle()}
      title={isThisSong ? 'stop' : 'play'}
    >
      {loadedPercent !== null ? `${loadedPercent}%` : isThisSong ? '■' : '▶'}
    </button>
  );
}
