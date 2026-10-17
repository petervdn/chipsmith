// The mixer, opened under the timeline: a strip per track in the timeline's order and colours, and
// at the end the master, which is the player's volume. What it shows and changes is the tracks'
// own (levels, mute and solo), so their rows on the timeline follow it.
import type { Track } from '../../shared/song.types.ts';
import { formatVolume, LOUDEST_DB } from '../player/volume.ts';
import { usePreferencesStore } from '../stores/preferences-store.ts';
import { Fader } from './Fader.tsx';
import { MixerStrip } from './MixerStrip.tsx';
import { getTrackColor } from './timeline.ts';
import type { TrackMix } from './track-mix.ts';
import { isHeard } from './track-mix.ts';
import './Mixer.css';

type MixerProps = {
  songId: string;
  tracks: Track[];
  mix: TrackMix;
  selectedTrackId: string | null;
  onSelect: (trackId: string) => void;
  onVolume: (trackId: string, volume: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
};

/**
 * Shows the mixer.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song.
 * @param props.tracks - Its tracks, as edited.
 * @param props.mix - The tracks muted and soloed.
 * @param props.selectedTrackId - The track selected, or null.
 * @param props.onSelect - Called with a track's id to select it.
 * @param props.onVolume - Called with a track's id and the level its fader is moved to.
 * @param props.onToggleMute - Called with a track's id to mute or unmute it.
 * @param props.onToggleSolo - Called with a track's id to solo it or stop soloing it.
 * @returns The mixer's element.
 */
export function Mixer({
  songId,
  tracks,
  mix,
  selectedTrackId,
  onSelect,
  onVolume,
  onToggleMute,
  onToggleSolo,
}: MixerProps) {
  const volume = usePreferencesStore((state) => state.volume);
  const setVolume = usePreferencesStore((state) => state.setVolume);
  return (
    <div className="mixer" role="group" aria-label="mixer">
      {tracks.map((track, i) => (
        <MixerStrip
          key={track.id}
          songId={songId}
          track={track}
          color={getTrackColor(i)}
          isSelected={track.id === selectedTrackId}
          isHeard={isHeard(track.id, mix)}
          isMuted={mix.muted.includes(track.id)}
          isSoloed={mix.soloed.includes(track.id)}
          onSelect={() => onSelect(track.id)}
          onVolume={(level) => onVolume(track.id, level)}
          onToggleMute={() => onToggleMute(track.id)}
          onToggleSolo={() => onToggleSolo(track.id)}
        />
      ))}
      <div className="mixer-master">
        <span className="mixer-master-name">master</span>
        <div className="mixer-master-level">
          <Fader
            volume={volume}
            onChange={setVolume}
            label="master (the player's volume)"
            loudest={LOUDEST_DB}
          />
        </div>
        <span className="mixer-master-value">{formatVolume(volume)}</span>
      </div>
    </div>
  );
}
