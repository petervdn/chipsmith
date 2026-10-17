// A level's fader: a slider in decibels, lying in a track's row or standing in the mixer, its level
// in its tooltip; a double click puts it back to 0 dB. It knows nothing of what it is the level of.
import { formatVolume, QUIETEST_DB, TRACK_LOUDEST_DB } from '../player/volume.ts';
import './Fader.css';

/** The fader's step, in decibels. */
const STEP_DB = 0.5;

type FaderProps = {
  volume: number;
  onChange: (volume: number) => void;
  label: string;
  isUpright?: boolean;
  loudest?: number;
};

/**
 * Shows a fader.
 *
 * @param props - The component's props.
 * @param props.volume - The level, in decibels.
 * @param props.onChange - Called with the level the fader is moved to.
 * @param props.label - What it is the level of, for its tooltip and screen readers.
 * @param props.isUpright - Whether it stands (in the mixer) rather than lies (in a track's row).
 * @param props.loudest - The loudest it goes, in decibels; a track's +6 dB unless given.
 * @returns The fader's element.
 */
export function Fader({
  volume,
  onChange,
  label,
  isUpright = false,
  loudest = TRACK_LOUDEST_DB,
}: FaderProps) {
  return (
    <input
      type="range"
      className={`fader${isUpright ? ' is-upright' : ''}`}
      min={QUIETEST_DB}
      max={loudest}
      step={STEP_DB}
      value={volume}
      onChange={(event) => onChange(Number(event.target.value))}
      onDoubleClick={() => onChange(Math.min(0, loudest))}
      aria-label={`${label} level`}
      data-tooltip={`${label}: ${formatVolume(volume)} (double click: 0 dB)`}
    />
  );
}
