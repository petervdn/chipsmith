// The editor's ■ and ▶ / ❚❚: stop (back to the cursor), only while playing or paused; play or
// pause on one button; and follow, switching whether the timeline scrolls with the playhead. It
// knows nothing of how the song is played.
import { LoaderCircle, Pause, Play, Square } from 'lucide-react';
import { ControlGroup } from './ControlGroup.tsx';
import type { PlayerMode } from '../stores/player-store.ts';
import './TransportButtons.css';

type TransportButtonsProps = {
  mode: PlayerMode;
  isPaused: boolean;
  isWaitingForAudio: boolean;
  onStop: () => void;
  onTogglePlaying: () => void;
  isFollowing: boolean;
  onToggleFollowing: () => void;
};

/**
 * Shows stop, and play or pause.
 *
 * @param props - The component's props.
 * @param props.mode - The song's mode: stopped, loading or playing.
 * @param props.isPaused - Whether the song is paused.
 * @param props.isWaitingForAudio - Whether its audio is still being rendered, so it cannot play.
 * @param props.onStop - Called to stop and go back to the cursor.
 * @param props.onTogglePlaying - Called to play, or to pause while playing.
 * @param props.isFollowing - Whether the timeline follows the playhead.
 * @param props.onToggleFollowing - Called to switch following on or off.
 * @returns The buttons' element.
 */
export function TransportButtons({
  mode,
  isPaused,
  isWaitingForAudio,
  onStop,
  onTogglePlaying,
  isFollowing,
  onToggleFollowing,
}: TransportButtonsProps) {
  return (
    <ControlGroup label="play">
      <button
        type="button"
        className="transport-buttons-button"
        onClick={onStop}
        disabled={mode === 'stopped' && !isPaused}
        data-tooltip="stop, back to the cursor"
        aria-label="stop, back to the cursor"
      >
        <Square fill="currentColor" />
      </button>
      <button
        type="button"
        className={`transport-buttons-button${mode === 'stopped' ? '' : ' is-on'}`}
        onClick={onTogglePlaying}
        disabled={isWaitingForAudio}
        data-tooltip={getPlayTooltip({ mode, isPaused })}
        aria-label={getPlayTooltip({ mode, isPaused })}
      >
        {getPlayIcon(mode)}
      </button>
      <button
        type="button"
        className={`transport-buttons-follow${isFollowing ? ' is-on' : ''}`}
        onClick={onToggleFollowing}
        aria-pressed={isFollowing}
        data-tooltip={
          isFollowing
            ? 'following the playhead: the timeline scrolls with it'
            : 'follow the playhead: scroll the timeline with it'
        }
      >
        follow
      </button>
    </ControlGroup>
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
 * Returns the tooltip of the play button: what pressing it does.
 *
 * @param state - The song's state.
 * @param state.mode - The song's mode.
 * @param state.isPaused - Whether it is paused.
 * @returns The tooltip.
 */
function getPlayTooltip({ mode, isPaused }: { mode: PlayerMode; isPaused: boolean }): string {
  if (mode !== 'stopped') return 'pause (Space)';
  return isPaused ? 'play on from the pause (Space)' : 'play from the cursor (Space)';
}
