// The editor bar's metronome: a switch that clicks the beats while the song plays (the first of a
// bar higher), and a small slider for how loud (up to well above the music), beside it. Both are kept in the preferences.
import { Metronome } from 'lucide-react';
import { METRONOME_LOUDEST_DB, QUIETEST_DB, formatVolume } from '../player/volume.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { ControlGroup } from './ControlGroup.tsx';
import './MetronomeControls.css';

/**
 * Shows the metronome's switch and its volume.
 *
 * @returns The controls' group.
 */
export function MetronomeControls() {
  const isOn = usePreferencesStore((state) => state.isMetronomeOn);
  const setOn = usePreferencesStore((state) => state.setMetronomeOn);
  const volume = usePreferencesStore((state) => state.metronomeVolume);
  const setVolume = usePreferencesStore((state) => state.setMetronomeVolume);
  const label = isOn ? 'metronome on: clicks the beats while playing' : 'metronome off';
  return (
    <ControlGroup label="metronome">
      <button
        type="button"
        className={`metronome-controls-switch${isOn ? ' is-on' : ''}`}
        onClick={() => setOn(!isOn)}
        aria-pressed={isOn}
        aria-label={label}
        data-tooltip={label}
      >
        <Metronome />
      </button>
      <input
        type="range"
        className="metronome-controls-volume"
        min={QUIETEST_DB}
        max={METRONOME_LOUDEST_DB}
        step={1}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        aria-label="metronome volume"
        data-tooltip={`metronome volume: ${formatVolume(volume)}`}
      />
    </ControlGroup>
  );
}
