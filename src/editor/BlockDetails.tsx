// The selected block's details: where it plays, its clip (what it is, its facts, the prompt and
// guides it was made with) and the versions of the clip; ▶ plays the song from the block.
import { Minus, Play, Plus } from 'lucide-react';
import type { Clip } from '../../shared/clip.types.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.types.ts';
import { getClipLabel } from '../../shared/clip-label.ts';
import { formatSeconds } from '../format.ts';
import type { BlockSpan } from './timeline.ts';
import { getTicksPerBar } from './timeline.ts';
import { getChannelName } from '../../shared/clip-channels.ts';
import './BlockDetails.css';

type BlockDetailsProps = {
  song: Song;
  span: BlockSpan;
  clip: Clip | undefined;
  versions: Clip[];
  onPlayFrom: (seconds: number) => void;
  onRepeats: (repeats: number) => void;
  onDuplicate: () => void;
  onUntrim: () => void;
  onRemove: () => void;
};

/**
 * Shows the selected block's details: where it plays, its clip and the clip's versions, and ▶ to play
 * the song from the block.
 *
 * @param props - The component's props.
 * @param props.song - The song the block is in.
 * @param props.span - The block, as the timeline draws it.
 * @param props.clip - The block's clip, or undefined when it is missing.
 * @param props.versions - The versions of the clip, oldest first.
 * @param props.onRepeats - Called with how many times the block should play.
 * @param props.onDuplicate - Called to place a copy right after the block.
 * @param props.onUntrim - Called to let the block play its whole clip again.
 * @param props.onRemove - Called to remove the block.
 * @param props.onPlayFrom - Called with the block's start, in seconds, to play the song from there.
 * @returns The block details element.
 */
export function BlockDetails({
  song,
  span,
  clip,
  versions,
  onPlayFrom,
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
  return (
    <section className="block-details">
      <header className="block-details-head">
        <h2 className="block-details-title">
          {clip ? getClipLabel(clip) : `missing ${span.clipId}`}
        </h2>
        <span className="block-details-place">
          {trackName} · bar {fromBar} – {toBar}
          {span.repeats > 1 && ` · ×${span.repeats}`}
        </span>
        <button
          type="button"
          className="block-details-play"
          onClick={() => onPlayFrom(startSeconds)}
        >
          <Play fill="currentColor" /> from here
        </button>
      </header>
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
        {clip && span.slice && span.slice.duration < clip.seconds - 0.01 && (
          <button type="button" onClick={onUntrim} data-tooltip="play the whole clip again">
            Untrim
          </button>
        )}
        <button type="button" className="block-details-remove" onClick={onRemove}>
          Remove
        </button>
      </div>
      {clip && (
        <>
          <p className="block-details-facts">
            {clip.id} · {Math.round(clip.bpm)} bpm · {formatSeconds(clip.seconds)}
            {span.slice && span.slice.duration < clip.seconds - 0.01
              ? ` (plays ${formatSeconds(span.slice.duration)})`
              : ''}
            {clip.chips.length > 0 && ` · ${clip.chips.join(' + ')}`}
            {clip.channels.length > 0 &&
              ` · ${clip.channels.length === 1 ? 'channel' : `${clip.channels.length} channels`}: ${clip.channels.map((channel) => getChannelName(clip.chips, channel)).join(', ')}`}{' '}
            · made {clip.created.slice(0, 10)}
          </p>
          <p className="block-details-prompt">{clip.prompt || 'No prompt.'}</p>
          {clip.guides.length > 0 && (
            <p className="block-details-guides">
              with {clip.guides.map((guide) => guide.name).join(', ')}
            </p>
          )}
          {versions.length > 1 && (
            <div className="block-details-versions">
              <h3 className="block-details-subtitle">Versions</h3>
              <ol>
                {versions.map((version) => (
                  <li key={version.id} className={version.id === clip.id ? 'is-current' : ''}>
                    {version.id} · {version.created.slice(0, 10)}
                    {version.id === clip.id && ' · in this block'}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
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
