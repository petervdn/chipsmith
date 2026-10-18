// Where the player is in what it plays, read every frame while it plays, for a place shown as
// numbers or a slider.
import { useEffect, useState } from 'react';
import { getSongPosition } from '../playback/audio-engine.ts';

/**
 * Returns the second the player is at, kept current every frame while it plays.
 *
 * @param isPlaying - Whether what the caller shows is playing; while it is not, nothing is read.
 * @returns The second it is at while playing, or null while not (or before the first frame).
 */
export function useLivePosition(isPlaying: boolean): number | null {
  const [position, setPosition] = useState<number | null>(null);
  useEffect(() => {
    if (!isPlaying) return;
    let frame = requestAnimationFrame(follow);
    function follow(): void {
      setPosition(getSongPosition());
      frame = requestAnimationFrame(follow);
    }
    return () => {
      cancelAnimationFrame(frame);
      setPosition(null);
    };
  }, [isPlaying]);
  return isPlaying ? position : null;
}
