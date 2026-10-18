// The selected block's section of the details: where it plays (its track and bars), which clip it
// plays and how much of it; ▶ plays the song from the block, Loop it plays its bars round, solo
// leaves its track alone; its repeats, Duplicate, Untrim and Remove. The clip itself is its own
// section (ClipDetails.tsx).
import { Minus, Play, Plus, Repeat } from 'lucide-react';
import type { Clip } from '../../shared/clip.schema.ts';
import { getClipLabel } from '../../shared/clip-label.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.schema.ts';
import { formatSeconds } from '../format.ts';
import { DetailsSection } from './DetailsSection.tsx';
import type { BlockSpan } from './timeline.ts';
import { getTicksPerBar } from './timeline.ts';
import { ToggleButton } from './ToggleButton.tsx';
import './BlockDetails.css';

type BlockDetailsProps = {
  song: Song;
  span: BlockSpan;
  clip: Clip | undefined;
  isSoloed: boolean;
  onPlayFrom: (seconds: number) => void;
  onLoop: () => void;
  onToggleSolo: () => void;
  onRepeats: (repeats: number) => void;
  onDuplicate: () => void;
  onUntrim: () => void;
  onRemove: () => void;
};

/**
 * Shows the selected block's section: where it plays, the clip it plays, and what can be done with
 * it.
 *
 * @param props - The component's props.
 * @param props.song - The song the block is in.
 * @param props.span - The block, as the timeline draws it.
 * @param props.clip - The block's clip, or undefined when it is missing.
 * @param props.isSoloed - Whether the block's track is soloed.
 * @param props.onPlayFrom - Called with the block's start, in seconds, to play the song from there.
 * @param props.onLoop - Called to loop the block's bars and play them.
 * @param props.onToggleSolo - Called to solo the block's track, or stop soloing it.
 * @param props.onRepeats - Called with how many times the block should play.
 * @param props.onDuplicate - Called to place a copy right after the block.
 * @param props.onUntrim - Called to let the block play its whole clip again.
 * @param props.onRemove - Called to remove the block.
 * @returns The section element.
 */
export function BlockDetails({
  song,
  span,
  clip,
  isSoloed,
  onPlayFrom,
  onLoop,
  onToggleSolo,
  onRepeats,
  onDuplicate,
  onUntrim,
  onRemove,
}: BlockDetailsProps) {
  const ticksPerBar = getTicksPerBar(song);
  const trackName = song.tracks.find((track) => track.id === span.trackId)?.name ?? span.trackId;
  const fromBar = formatBar(span.start / ticksPerBar);
  const toBar = formatBar(span.end / ticksPerBar);
  const startSeconds = span.start / getTicksPerSecond(song.bpm);
  const isTrimmed =
    clip !== undefined && span.slice !== null && span.slice.duration < clip.seconds - 0.01;
  return (
    <DetailsSection
      kind="block"
      title={`${trackName} · bar ${fromBar} – ${toBar}`}
      aside={
        <button
          type="button"
          className="block-details-play"
          onClick={() => onPlayFrom(startSeconds)}
        >
          <Play fill="currentColor" /> from here
        </button>
      }
    >
      <p className="block-details-facts">
        plays {clip ? getClipLabel(clip) : `${span.clipId}, which is missing`}
        {isTrimmed && span.slice && ` (${formatSeconds(span.slice.duration)} of it)`}
        {span.repeats > 1 && `, ×${span.repeats}`}
      </p>
      <div className="block-details-actions">
        <button type="button" onClick={onLoop} data-tooltip="play the bars of this block round">
          <Repeat /> Loop it
        </button>
        <ToggleButton
          label="solo"
          isOn={isSoloed}
          onToggle={onToggleSolo}
          tooltip="hear this block's track alone"
        />
      </div>
      <div className="block-details-actions">
        <span className="block-details-repeats">
          <button
            type="button"
            onClick={() => onRepeats(span.repeats - 1)}
            disabled={span.repeats <= 1}
            data-tooltip="play it one time fewer"
            aria-label="play it one time fewer"
          >
            <Minus />
          </button>
          <span>×{span.repeats}</span>
          <button
            type="button"
            onClick={() => onRepeats(span.repeats + 1)}
            data-tooltip="play it once more"
            aria-label="play it once more"
          >
            <Plus />
          </button>
        </span>
        <button type="button" onClick={onDuplicate} data-tooltip="place a copy right after it">
          Duplicate
        </button>
        {isTrimmed && (
          <button type="button" onClick={onUntrim} data-tooltip="play the whole clip again">
            Untrim
          </button>
        )}
        <button type="button" className="block-details-remove" onClick={onRemove}>
          Remove
        </button>
      </div>
    </DetailsSection>
  );
}

/**
 * Formats a bar as the page counts it: from 1, with a fraction where it starts inside one.
 *
 * @param bar - The bar, counted from 0.
 * @returns The bar counted from 1, to two decimals at most.
 */
function formatBar(bar: number): string {
  const rounded = Math.round((bar + 1) * 100) / 100;
  return String(rounded);
}
