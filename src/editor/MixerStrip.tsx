// A track's strip in the mixer: a cap in its colour, its name (which selects it), its fader standing
// beside its meter, its level, and its M and S. The same track's row on the timeline shows the same
// values; changing either changes both.
import type { CSSProperties } from 'react';
import type { Track } from '../../shared/song.types.ts';
import { formatVolume } from '../player/volume.ts';
import { Fader } from './Fader.tsx';
import { TrackMeter } from './TrackMeter.tsx';
import { TrackMixButtons } from './TrackMixButtons.tsx';
import './MixerStrip.css';

type MixerStripProps = {
  songId: string;
  track: Track;
  color: string;
  isSelected: boolean;
  isHeard: boolean;
  isMuted: boolean;
  isSoloed: boolean;
  onSelect: () => void;
  onVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
};

/**
 * Shows a track's strip in the mixer.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song, whose playing the meter follows.
 * @param props.track - The track.
 * @param props.color - Its colour, as on the timeline.
 * @param props.isSelected - Whether it is the track selected.
 * @param props.isHeard - Whether mute and solo leave it heard; one not heard is drawn faint.
 * @param props.isMuted - Whether it is muted.
 * @param props.isSoloed - Whether it is soloed.
 * @param props.onSelect - Called to select the track.
 * @param props.onVolume - Called with the level its fader is moved to.
 * @param props.onToggleMute - Called to mute or unmute it.
 * @param props.onToggleSolo - Called to solo it or stop soloing it.
 * @returns The strip's element.
 */
export function MixerStrip({
  songId,
  track,
  color,
  isSelected,
  isHeard,
  isMuted,
  isSoloed,
  onSelect,
  onVolume,
  onToggleMute,
  onToggleSolo,
}: MixerStripProps) {
  const style: CSSProperties & Record<'--track-color', string> = { '--track-color': color };
  return (
    <div
      className={`mixer-strip${isSelected ? ' is-selected' : ''}${isHeard ? '' : ' is-unheard'}`}
      style={style}
    >
      <button
        type="button"
        className="mixer-strip-name"
        onClick={onSelect}
        data-tooltip={`${track.name}: select the track`}
      >
        {track.name}
      </button>
      <div className="mixer-strip-levels">
        <Fader volume={track.volume} onChange={onVolume} label={track.name} isUpright />
        <TrackMeter songId={songId} trackId={track.id} />
      </div>
      <span className="mixer-strip-value">{formatVolume(track.volume)}</span>
      <TrackMixButtons
        isMuted={isMuted}
        isSoloed={isSoloed}
        onToggleMute={onToggleMute}
        onToggleSolo={onToggleSolo}
      />
    </div>
  );
}
