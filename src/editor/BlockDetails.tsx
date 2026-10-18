// The selected block's details: where it plays, its clip (what it is, its facts, its .fur file to
// look at), its takes to swap in, quick changes and the prompt for more takes (docs/adr/0037); ▶ plays the song from the
// block, Loop it plays its bars round, and solo leaves its track alone.
import { Minus, Play, Plus, Repeat } from 'lucide-react';
import type { Clip } from '../../shared/clip.types.ts';
import { getTicksPerSecond } from '../../shared/song-length.ts';
import type { Song } from '../../shared/song.types.ts';
import { getClipLabel } from '../../shared/clip-label.ts';
import { formatSeconds } from '../format.ts';
import type { BlockSpan } from './timeline.ts';
import { getTicksPerBar } from './timeline.ts';
import { getChannelName, isPitchedChannel } from '../../shared/clip-channels.ts';
import { ClipOperations } from './ClipOperations.tsx';
import { ClipFileLinks } from './ClipFileLinks.tsx';
import { ClipPrompt } from './ClipPrompt.tsx';
import { ClipTakes } from './ClipTakes.tsx';
import { ToggleButton } from './ToggleButton.tsx';
import './BlockDetails.css';

type BlockDetailsProps = {
  song: Song;
  span: BlockSpan;
  clip: Clip | undefined;
  versions: Clip[];
  isSoloed: boolean;
  onPlayFrom: (seconds: number) => void;
  onLoop: () => void;
  onToggleSolo: () => void;
  onUseVersion: (clipId: string) => void;
  onRepeats: (repeats: number) => void;
  onDuplicate: () => void;
  onUntrim: () => void;
  onRemove: () => void;
};

/**
 * Shows the selected block's details: where it plays, its clip, its takes and the prompt for more,
 * ▶ to play the song from the block, and its bars looped, its track alone, to listen to them.
 *
 * @param props - The component's props.
 * @param props.song - The song the block is in.
 * @param props.span - The block, as the timeline draws it.
 * @param props.clip - The block's clip, or undefined when it is missing.
 * @param props.versions - The versions of the clip, oldest first.
 * @param props.isSoloed - Whether the block's track is soloed.
 * @param props.onLoop - Called to loop the block's bars and play them.
 * @param props.onToggleSolo - Called to solo the block's track, or stop soloing it.
 * @param props.onUseVersion - Called with a take's id to put it in the block.
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
  isSoloed,
  onPlayFrom,
  onLoop,
  onToggleSolo,
  onUseVersion,
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
          <ClipFileLinks clipId={clip.id} />
          {versions.length > 1 && (
            <ClipTakes versions={versions} currentClipId={clip.id} onUse={onUseVersion} />
          )}
          {clip.channels.some((channel) => isPitchedChannel(clip.chips, channel)) && (
            <ClipOperations clipId={clip.id} songId={song.id} onMade={onUseVersion} />
          )}
          <ClipPrompt clipId={clip.id} songId={song.id} />
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
