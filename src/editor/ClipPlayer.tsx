// A clip's own player in its section of the details: ▶ / ❚❚, and its whole waveform beside it, faint
// where it has not played and in the text's colour up to the playhead; a tap on the waveform plays
// from there. It plays the clip alone, instead of the song (use-clip-player.ts).
import { Pause, Play } from 'lucide-react';
import { useRef } from 'react';
import type { Clip } from '../../shared/clip.schema.ts';
import { useClipPlayer } from './use-clip-player.ts';
import { useElementWidth } from './use-element-width.ts';
import { Waveform } from './Waveform.tsx';
import './ClipPlayer.css';

type ClipPlayerProps = { clip: Clip };

/**
 * Shows a clip's player: play and pause, and its waveform with the part played marked.
 *
 * @param props - The component's props.
 * @param props.clip - The clip.
 * @returns The player's element.
 */
export function ClipPlayer({ clip }: ClipPlayerProps) {
  const waveRef = useRef<HTMLButtonElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(waveRef);
  const { isPlaying, toggle, playAt } = useClipPlayer(clip, playedRef);
  const label = isPlaying ? 'pause the clip' : 'play the clip on its own';
  return (
    <div className="clip-player">
      <button
        type="button"
        className="clip-player-play"
        onClick={toggle}
        aria-label={label}
        data-tooltip={label}
      >
        {isPlaying ? <Pause /> : <Play />}
      </button>
      <button
        ref={waveRef}
        type="button"
        className="clip-player-wave"
        aria-label="play the clip from here"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          playAt((event.clientX - box.left) / box.width);
        }}
      >
        <div className="clip-player-layer is-faint">
          <Waveform clipId={clip.id} offset={0} duration={clip.seconds} width={width} />
        </div>
        <div ref={playedRef} className="clip-player-layer is-played">
          <Waveform clipId={clip.id} offset={0} duration={clip.seconds} width={width} />
        </div>
      </button>
    </div>
  );
}
