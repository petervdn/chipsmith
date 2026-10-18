// The editor's transport, large at the left of its bar: ■ stop (back to the cursor, and again back to
// the start), ▶ / ❚❚ play or pause on one button, and where the song is of how long it is. It knows
// nothing of how the song is played.
import { LoaderCircle, Pause, Play, Square } from 'lucide-react';
import { formatSeconds } from '../format.ts';
import { useLivePosition } from '../player/use-live-position.ts';
import type { PlayerMode } from '../stores/player-store.ts';
import type { useSongTransport } from './use-song-transport.ts';
import './TransportButtons.css';

type TransportButtonsProps = {
  transport: ReturnType<typeof useSongTransport>;
  isWaitingForAudio: boolean;
};

/**
 * Shows stop, play or pause, and the time.
 *
 * @param props - The component's props.
 * @param props.transport - Playing the song: its mode, cursor and length, stop and play.
 * @param props.isWaitingForAudio - Whether its audio is still being rendered, so it cannot play.
 * @returns The transport's element.
 */
export function TransportButtons({ transport, isWaitingForAudio }: TransportButtonsProps) {
  const { mode, isPaused, canStop, cursor, end } = transport;
  const livePosition = useLivePosition(mode === 'playing');
  return (
    <div className="transport-buttons" role="group" aria-label="transport">
      <button
        type="button"
        className="transport-buttons-button"
        onClick={transport.stop}
        disabled={!canStop}
        data-tooltip={getStopLabel({ mode, isPaused })}
        aria-label={getStopLabel({ mode, isPaused })}
      >
        <Square fill="currentColor" />
      </button>
      <button
        type="button"
        className={`transport-buttons-button is-play${mode === 'stopped' ? '' : ' is-on'}`}
        onClick={transport.togglePlaying}
        disabled={isWaitingForAudio}
        data-tooltip={getPlayLabel({ mode, isPaused })}
        aria-label={getPlayLabel({ mode, isPaused })}
      >
        {getPlayIcon(mode)}
      </button>
      <span className="transport-buttons-time">
        {formatSeconds(livePosition ?? cursor)}
        <span className="transport-buttons-end"> / {formatSeconds(end)}</span>
      </span>
    </div>
  );
}

/**
 * Returns the icon on the play button: ▶ to play, a turning circle while loading, ❚❚ to pause.
 *
 * @param mode - The song's mode.
 * @returns The icon's element.
 */
function getPlayIcon(mode: PlayerMode) {
  if (mode === 'loading') return <LoaderCircle className="icon-spin" />;
  return mode === 'playing' ? <Pause fill="currentColor" /> : <Play fill="currentColor" />;
}

/**
 * Returns what the play button does, for its tooltip and screen readers.
 *
 * @param state - The song's state.
 * @param state.mode - The song's mode.
 * @param state.isPaused - Whether it is paused.
 * @returns The words.
 */
function getPlayLabel({ mode, isPaused }: { mode: PlayerMode; isPaused: boolean }): string {
  if (mode !== 'stopped') return 'pause (Space)';
  return isPaused ? 'play on from the pause (Space)' : 'play from the cursor (Space)';
}

/**
 * Returns what the stop button does, for its tooltip and screen readers.
 *
 * @param state - The song's state.
 * @param state.mode - The song's mode.
 * @param state.isPaused - Whether it is paused.
 * @returns The words.
 */
function getStopLabel({ mode, isPaused }: { mode: PlayerMode; isPaused: boolean }): string {
  return mode !== 'stopped' || isPaused ? 'stop, back to the cursor' : 'back to the start';
}
