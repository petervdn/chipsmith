// ▶ for one song in a list or on its page: loads the song when pressed and plays it from the start,
// or stops it when it is the one playing. Filled orange while its song plays; … and not pressable
// while the server renders its audio.
import { LoaderCircle, Play, Square } from 'lucide-react';
import { getSongPosition } from '../playback/audio-engine.ts';
import { fetchSong } from '../queries/songs.ts';
import { usePlayerStore } from '../stores/player-store.ts';
import './PlayButton.css';

type PlayButtonProps = { songId: string; isWaitingForAudio: boolean };

/**
 * Shows the play button of a song: it loads and plays the song from the start, or stops it when it
 * is the one playing, and shows the share loaded while it loads.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song it plays.
 * @param props.isWaitingForAudio - Whether the server is still rendering the song's audio, which
 *   shows … and cannot be pressed.
 * @returns The button element.
 */
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
      <button
        type="button"
        className="play-button"
        disabled
        data-tooltip="its audio is being rendered"
        aria-label="its audio is being rendered"
      >
        <LoaderCircle className="icon-spin" />
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`play-button${isThisSong ? ' is-playing' : ''}`}
      onClick={() => void toggle()}
      data-tooltip={isThisSong ? 'stop' : 'play'}
      aria-label={isThisSong ? 'stop' : 'play'}
    >
      {loadedPercent !== null ? (
        `${loadedPercent}%`
      ) : isThisSong ? (
        <Square fill="currentColor" />
      ) : (
        <Play fill="currentColor" />
      )}
    </button>
  );
}
