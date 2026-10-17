// A track's level meter: a thin upright bar beside its name, lit from the bottom to the level it plays
// at, with a peak mark above it.
import { useRef } from 'react';
import { useTrackMeter } from './use-track-meter.ts';
import './TrackMeter.css';

type TrackMeterProps = { songId: string; trackId: string };

/**
 * Shows the level a track plays at.
 *
 * @param props - The component's props.
 * @param props.songId - The id of the song the track is in.
 * @param props.trackId - The id of the track.
 * @returns The meter's element.
 */
export function TrackMeter({ songId, trackId }: TrackMeterProps) {
  const meterRef = useRef<HTMLSpanElement>(null);
  useTrackMeter(meterRef, { songId, trackId });
  return (
    <span ref={meterRef} className="track-meter" aria-hidden="true">
      <span className="track-meter-level" />
      <span className="track-meter-peak" />
    </span>
  );
}
