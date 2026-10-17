// The bar at the bottom of every page while a song is in the player: ▶ / ■ (the share loaded while it
// loads), the song's title, where it is, a slider to move in it, and the mute switch for testing.
import { useEffect, useState } from 'react';
import { formatSeconds } from './format.ts';
import { getSongPosition } from './playback/audio-engine.ts';
import { usePlayerStore } from './stores/player-store.ts';
import { usePreferencesStore } from './stores/preferences-store.ts';

/** The player bar. */
export function PlayerBar() {
  const player = usePlayerStore();
  const { playSong, seekSong, stopSong } = player;
  const isMuteOn = usePreferencesStore((preferences) => preferences.isMuted);
  const setMuted = usePreferencesStore((preferences) => preferences.setMuted);
  const [livePosition, setLivePosition] = useState<number | null>(null);
  useEffect(() => {
    if (player.mode !== 'playing') return;
    let frame = requestAnimationFrame(follow);
    function follow(): void {
      setLivePosition(getSongPosition());
      frame = requestAnimationFrame(follow);
    }
    return () => cancelAnimationFrame(frame);
  }, [player.mode]);
  const position = player.mode === 'playing' ? (livePosition ?? player.from) : player.from;
  const { song } = player;
  if (!song) return null;

  function togglePlay(): void {
    if (!song) return;
    if (player.mode === 'stopped') void playSong(song, position);
    else stopSong(getSongPosition() ?? position);
  }

  return (
    <div className="player-bar">
      <button
        type="button"
        className={`player-play${player.mode === 'loading' ? ' is-loading' : ''}`}
        onClick={togglePlay}
        title={player.mode === 'stopped' ? 'play' : 'stop'}
      >
        {player.mode === 'loading'
          ? `${Math.round(player.loaded * 100)}%`
          : player.mode === 'playing'
            ? '■'
            : '▶'}
      </button>
      <div className="player-middle">
        <a className="player-title" href={`/songs/${encodeURIComponent(song.song.id)}`}>
          {song.song.title}
        </a>
        <input
          className="player-seek"
          type="range"
          min={0}
          max={player.end || 1}
          step={0.1}
          value={Math.min(position, player.end)}
          onChange={(event) => seekSong(Number(event.target.value))}
        />
      </div>
      <span className="player-time">
        {formatSeconds(position)} / {formatSeconds(player.end)}
      </span>
      <button
        type="button"
        className={`player-mute${isMuteOn ? ' is-on' : ''}`}
        onClick={() => setMuted(!isMuteOn)}
        title={isMuteOn ? 'muted (for testing); press to hear' : 'mute'}
      >
        {isMuteOn ? '🔇' : '🔊'}
      </button>
      {player.error && <p className="player-error">{player.error}</p>}
    </div>
  );
}
