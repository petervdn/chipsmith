// The editor bar's metronome: a switch that clicks the beats while the song plays (the first of a
// bar higher), and a small slider for how loud (up to well above the music), beside it. Both are kept in the preferences.
import { METRONOME_LOUDEST_DB, QUIETEST_DB, formatVolume } from '../player/volume.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { ControlGroup } from './ControlGroup.tsx';
import { ToggleButton } from './ToggleButton.tsx';
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
  return (
    <ControlGroup label="metronome">
      <ToggleButton
        label="on"
        isOn={isOn}
        onToggle={() => setOn(!isOn)}
        tooltip="click the beats while playing, the first of a bar higher"
      />
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
