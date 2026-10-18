// The bar at the bottom of every page but a song's while a song (or a reference's audio) is in the
// player: ▶ / ■ (the share loaded while it loads), its title, where it is, a slider to move in it,
// and the mute switch for testing.
import { Play, Square } from 'lucide-react';
import { formatSeconds } from '../format.ts';
import { getSongPosition } from '../playback/audio-engine.ts';
import { usePlayerStore } from '../stores/player-store.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { LOUDEST_DB, QUIETEST_DB, formatVolume } from './volume.ts';
import { useLivePosition } from './use-live-position.ts';
import './PlayerBar.css';

/**
 * Shows the player bar while a song or a reference's audio is in the player: ▶ / ■, its title, where
 * it is, a slider to move in it, and the mute switch.
 *
 * @returns The bar's element, or null when nothing is in the player.
 */
export function PlayerBar() {
  const player = usePlayerStore();
  const { playSong, playReference, seekSong, stopSong } = player;
  const isMuteOn = usePreferencesStore((preferences) => preferences.isMuted);
  const setMuted = usePreferencesStore((preferences) => preferences.setMuted);
  const volume = usePreferencesStore((preferences) => preferences.volume);
  const setVolume = usePreferencesStore((preferences) => preferences.setVolume);
  const livePosition = useLivePosition(player.mode === 'playing');
  const position = player.mode === 'playing' ? (livePosition ?? player.from) : player.from;
  const { song, reference } = player;
  const playing = song
    ? { title: song.song.title, href: `/songs/${encodeURIComponent(song.song.id)}` }
    : reference
      ? {
          title: reference.title,
          href: `/references/${encodeURIComponent(reference.referenceId)}`,
        }
      : null;
  if (!playing) return null;

  function togglePlay(): void {
    if (player.mode !== 'stopped') stopSong(getSongPosition() ?? position);
    else if (song) void playSong(song, position);
    else if (reference) void playReference(reference, position);
  }

  return (
    <div className="player-bar">
      <button
        type="button"
        className={`player-bar-play${player.mode === 'loading' ? ' is-loading' : ''}`}
        onClick={togglePlay}
        aria-label={player.mode === 'stopped' ? 'play' : 'stop'}
      >
        {player.mode === 'loading' ? (
          `${Math.round(player.loaded * 100)}%`
        ) : player.mode === 'playing' ? (
          <Square fill="currentColor" />
        ) : (
          <Play fill="currentColor" />
        )}
      </button>
      <div className="player-bar-middle">
        <a className="player-bar-title" href={playing.href}>
          {playing.title}
        </a>
        <input
          className="player-bar-seek"
          type="range"
          min={0}
          max={player.end || 1}
          step={0.1}
          value={Math.min(position, player.end)}
          onChange={(event) => seekSong(Number(event.target.value))}
        />
      </div>
      <span className="player-bar-time">
        {formatSeconds(position)} / {formatSeconds(player.end)}
      </span>
      <span className="player-bar-sound">
        <input
          className="player-bar-volume"
          type="range"
          min={QUIETEST_DB}
          max={LOUDEST_DB}
          step={1}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="volume"
          data-tooltip={`volume: ${formatVolume(volume)}`}
        />
        <button
          type="button"
          className={`player-bar-mute${isMuteOn ? ' is-on' : ''}`}
          onClick={() => setMuted(!isMuteOn)}
          data-tooltip={isMuteOn ? 'muted (for testing); press to hear' : 'mute'}
        >
          {isMuteOn ? '🔇' : '🔊'}
        </button>
      </span>
      {player.error && <p className="player-bar-error">{player.error}</p>}
    </div>
  );
}
