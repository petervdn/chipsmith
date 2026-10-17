// ▶ for a reference's mix or one of its channels alone: plays it from the start, or stops it when it
// is the one playing. Looks as a song's ▶ does.
import { Play, Square } from 'lucide-react';
import { getSongPosition } from '../playback/audio-engine.ts';
import type { ReferencePlay } from '../stores/player-store.ts';
import { usePlayerStore } from '../stores/player-store.ts';
import '../player/PlayButton.css';

type ReferencePlayButtonProps = { play: ReferencePlay; label: string };

/**
 * Shows the play button of a reference's mix or channel.
 *
 * @param props - The component's props.
 * @param props.play - What it plays.
 * @param props.label - What it plays, for screen readers and its tooltip.
 * @returns The button element.
 */
export function ReferencePlayButton({ play, label }: ReferencePlayButtonProps) {
  const isThis = usePlayerStore(
    (player) => player.reference?.url === play.url && player.mode !== 'stopped',
  );
  const loadedPercent = usePlayerStore((player) =>
    player.reference?.url === play.url && player.mode === 'loading'
      ? Math.round(player.loaded * 100)
      : null,
  );
  const playReference = usePlayerStore((player) => player.playReference);
  const stopSong = usePlayerStore((player) => player.stopSong);
  return (
    <button
      type="button"
      className={`play-button${isThis ? ' is-playing' : ''}`}
      onClick={() => (isThis ? stopSong(getSongPosition() ?? 0) : void playReference(play))}
      aria-label={isThis ? `stop ${label}` : `play ${label}`}
      data-tooltip={isThis ? 'stop' : `play ${label}`}
    >
      {loadedPercent !== null ? (
        `${loadedPercent}%`
      ) : isThis ? (
        <Square fill="currentColor" />
      ) : (
        <Play fill="currentColor" />
      )}
    </button>
  );
}
